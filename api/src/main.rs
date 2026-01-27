use axum::{
    Extension, Json, Router,
    extract::Path,
    http::Method,
    http::StatusCode,
    routing::{get, post},
};
use axum_macros::debug_handler;
use dotenv::dotenv;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::{
    Pool, Postgres,
    postgres::{PgConnectOptions, PgPoolOptions},
};
use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use tokio::sync::{RwLock, mpsc};
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing::{Level, info};
use tracing_subscriber;

mod config;
mod etherscan;

struct EtherscanRequest {
    job_id: String,
    chain: String,
    chain_id: u32,
    address: String,
}

// Channel sender for Etherscan fetch queue
type EtherscanQueue = mpsc::UnboundedSender<EtherscanRequest>;

#[derive(Clone, Debug, Serialize, Deserialize)]
struct Contract {
    chain: String,
    address: String,
    name: Option<String>,
    abi: Option<Value>,
    label: Option<String>,
    src: Option<String>,
}

#[derive(Clone, Serialize)]
struct Job {
    status: JobStatus,
    address: String,
    contract: Option<Contract>,
    #[serde(skip)]
    created_at: std::time::Instant,
}

#[derive(Clone, Serialize, PartialEq)]
#[serde(rename_all = "lowercase")]
enum JobStatus {
    Pending,
    Complete,
}

// Job state for polling
type Jobs = Arc<RwLock<HashMap<String, Job>>>;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();

    // Switch to Level::DEBUG for dev
    tracing_subscriber::fmt().with_max_level(Level::INFO).init();

    let host = std::env::var("HOST")?;
    // 8080 is default port for Cloud Run
    let port = std::env::var("PORT").unwrap_or("8080".to_string());

    let db_host = std::env::var("DB_HOST")?;
    let db_port = std::env::var("DB_PORT")?.parse::<u16>()?;
    let db_user = std::env::var("DB_USER")?;
    let db_pass = std::env::var("DB_PASS")?;
    let db = std::env::var("DB")?;

    // https://docs.cloud.google.com/sql/docs/mysql/connect-run?authuser=5&hl=en#python
    // https://github.com/launchbadge/sqlx/issues/144
    let db_options = PgConnectOptions::new()
        .host(&db_host)
        .port(db_port)
        .username(&db_user)
        .password(&db_pass)
        .database(&db);

    let pool = PgPoolOptions::new().connect_with(db_options).await?;
    info!("Connected to database");

    let jobs: Jobs = Arc::new(RwLock::new(HashMap::new()));

    // Create Etherscan fetch queue
    let (etherscan_tx, mut etherscan_rx) =
        mpsc::unbounded_channel::<EtherscanRequest>();

    // Spawn task to process Etherscan fetch queue sequentially
    let jobs_clone = jobs.clone();
    let pool_clone = pool.clone();
    tokio::spawn(async move {
        let delay = std::time::Duration::from_millis(
            (1000 / config::ETHERSCAN_RATE_LIMIT) + 1,
        );

        while let Some(req) = etherscan_rx.recv().await {
            match etherscan::get_contract(req.chain_id, &req.address).await {
                Ok(res) => {
                    let contract = Contract {
                        chain: req.chain.clone(),
                        address: res.addr.clone(),
                        name: res.name.clone(),
                        abi: res.abi.clone(),
                        label: None,
                        src: res.src.clone(),
                    };

                    let _ = sqlx::query!(
                        r#"
                            INSERT INTO contracts (chain, address, name, abi, src)
                            VALUES ($1, $2, $3, $4, $5)
                            ON CONFLICT (chain, address) DO UPDATE
                            SET name = EXCLUDED.name, abi = EXCLUDED.abi, src = EXCLUDED.src
                        "#,
                        contract.chain,
                        contract.address,
                        contract.name,
                        contract.abi,
                        contract.src
                    )
                    .execute(&pool_clone)
                    .await;

                    let mut guard = jobs_clone.write().await;
                    if let Some(job) = guard.get_mut(&req.job_id) {
                        job.contract = Some(contract);
                        job.status = JobStatus::Complete;
                    }
                }
                Err(e) => {
                    info!("Failed to fetch contract {}: {e}", req.address);
                    let mut guard = jobs_clone.write().await;
                    if let Some(job) = guard.get_mut(&req.job_id) {
                        job.status = JobStatus::Complete;
                    }
                }
            }

            tokio::time::sleep(delay).await;
        }
    });

    // Cleanup stale jobs every 60 seconds
    let jobs_cleanup = jobs.clone();
    tokio::spawn(async move {
        let ttl = std::time::Duration::from_secs(300);
        loop {
            tokio::time::sleep(std::time::Duration::from_secs(60)).await;
            let mut guard = jobs_cleanup.write().await;
            let before = guard.len();
            guard.retain(|_, job| job.created_at.elapsed() < ttl);
            let removed = before - guard.len();
            if removed > 0 {
                info!("Cleaned up {removed} stale jobs");
            }
        }
    });

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST])
        .allow_headers([http::header::CONTENT_TYPE]);

    let app = Router::new()
        .route("/", get(health_check))
        .route("/contracts/jobs", post(post_contracts_job))
        .route("/contracts/jobs/{job_id}", get(poll_contracts_job))
        .route("/contracts/{chain}/{address}", get(get_contract))
        .route("/fn-selectors/{selector}", get(get_fn_selectors))
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .layer(Extension(pool))
        .layer(Extension(jobs))
        .layer(Extension(etherscan_tx));

    let listener = tokio::net::TcpListener::bind(format!("{host}:{port}"))
        .await
        .unwrap();

    info!("Server is running on {host}:{port}");

    axum::serve(listener, app).await?;

    Ok(())
}

#[derive(Serialize)]
struct Health {
    status: &'static str,
}

async fn health_check() -> Result<Json<Health>, StatusCode> {
    Ok(Json(Health { status: "ok" }))
}

#[derive(Debug, Serialize, Deserialize)]
struct PostJobRequest {
    chain: String,
    addrs: Vec<String>,
}

#[derive(Serialize)]
struct PostJobResponse {
    job_ids: Vec<String>,
    contracts: Vec<Contract>,
}

async fn post_contracts_job(
    Extension(pool): Extension<Pool<Postgres>>,
    Extension(jobs): Extension<Jobs>,
    Extension(etherscan_queue): Extension<EtherscanQueue>,
    Json(req): Json<PostJobRequest>,
) -> Result<Json<PostJobResponse>, StatusCode> {
    // Validate inputs
    if req.chain.trim().is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }
    if req.addrs.is_empty() || req.addrs.iter().any(|a| a.trim().is_empty()) {
        return Err(StatusCode::BAD_REQUEST);
    }

    let chain_id =
        config::get_chain_id(&req.chain).ok_or(StatusCode::BAD_REQUEST)?;

    let contracts: Vec<Contract> = sqlx::query_as!(
        Contract,
        "SELECT chain, address, name, abi, label, NULL as src FROM contracts WHERE chain = $1 AND address = ANY($2)",
        req.chain, &req.addrs
    )
    .fetch_all(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let set: HashSet<String> =
        contracts.iter().map(|c| c.address.clone()).collect();
    let addrs_to_fetch: Vec<String> = req
        .addrs
        .iter()
        .filter(|addr| !set.contains(*addr))
        .cloned()
        .collect();

    // Send fetch requests to the queue
    let mut job_ids = Vec::new();
    if !addrs_to_fetch.is_empty() {
        let mut guard = jobs.write().await;

        for addr in addrs_to_fetch {
            let job_id = format!("{}:{}", req.chain, addr);

            if let Some(job) = guard.get(&job_id) {
                job_ids.push(job_id);
                continue;
            }

            if let Ok(_) = etherscan_queue.send(EtherscanRequest {
                job_id: job_id.clone(),
                chain: req.chain.clone(),
                chain_id,
                address: addr.clone(),
            }) {
                guard.insert(
                    job_id.clone(),
                    Job {
                        status: JobStatus::Pending,
                        contract: None,
                        address: addr,
                        created_at: std::time::Instant::now(),
                    },
                );
                job_ids.push(job_id);
            }
        }
    }

    Ok(Json(PostJobResponse { contracts, job_ids }))
}

// TODO: request and return multiple job states
async fn poll_contracts_job(
    Extension(jobs): Extension<Jobs>,
    Path(job_id): Path<String>,
) -> Result<Json<Job>, StatusCode> {
    let guard = jobs.read().await;
    let job = guard.get(&job_id).ok_or(StatusCode::NOT_FOUND)?;
    Ok(Json(job.clone()))
}

#[derive(Serialize, Deserialize)]
struct FnSelector {
    selector: String,
    name: String,
    inputs: Option<Value>,
    outputs: Option<Value>,
}

async fn get_fn_selectors(
    Extension(pool): Extension<Pool<Postgres>>,
    Path(selector): Path<String>,
) -> Result<Json<Vec<FnSelector>>, StatusCode> {
    // Validate selector is not empty
    if selector.trim().is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    let selectors = sqlx::query_as!(
        FnSelector,
        "SELECT selector, name, inputs, outputs FROM fn_selectors WHERE selector = $1",
        selector
    )
    .fetch_all(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(selectors))
}

async fn get_contract(
    Extension(pool): Extension<Pool<Postgres>>,
    Path((chain, addr)): Path<(String, String)>,
) -> Result<Json<Option<Contract>>, StatusCode> {
    // Validate inputs are not empty
    if chain.trim().is_empty() || addr.trim().is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    let contract = sqlx::query_as!(
        Contract,
        "SELECT chain, address, name, abi, label, src FROM contracts WHERE chain = $1 AND address = $2",
        chain, addr
    )
    .fetch_one(&pool)
    .await
    .ok();

    Ok(Json(contract))
}
