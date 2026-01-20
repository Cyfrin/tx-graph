use axum::{
    Extension, Json, Router,
    extract::Path,
    http::Method,
    http::StatusCode,
    routing::{get, post},
};
use axum_macros::debug_handler;
use dotenv::dotenv;
use futures::stream::{FuturesUnordered, StreamExt};
use http::HeaderValue;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::{
    Pool, Postgres,
    postgres::{PgConnectOptions, PgPoolOptions},
};
use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use tokio::sync::RwLock;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing::{Level, info};
use tracing_subscriber;

mod config;
mod etherscan;

// Job queue for polling
type Queue = Arc<RwLock<HashMap<String, Job>>>;

#[derive(Clone, Serialize)]
struct Job {
    status: JobStatus,
    contracts: Vec<Contract>,
    total: usize,
    fetched: usize,
    #[serde(skip)]
    created_at: std::time::Instant,
}

#[derive(Clone, Serialize, PartialEq)]
#[serde(rename_all = "lowercase")]
enum JobStatus {
    Pending,
    Complete,
}

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

    let jobs: Queue = Arc::new(RwLock::new(HashMap::new()));

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
        .route("/contracts", post(post_contracts))
        .route("/contracts/jobs", post(post_contracts_job))
        .route("/contracts/jobs/{job_id}", get(poll_contracts_job))
        .route("/contracts/{chain}/{address}", get(get_contract))
        .route("/fn-selectors/{selector}", get(get_fn_selectors))
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .layer(Extension(pool))
        .layer(Extension(jobs));

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

#[derive(Clone, Debug, Serialize, Deserialize)]
struct Contract {
    chain: String,
    address: String,
    name: Option<String>,
    abi: Option<Value>,
    label: Option<String>,
    src: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct PostContractsRequest {
    chain: String,
    addrs: Vec<String>,
}

// #[debug_handler]
async fn post_contracts(
    Extension(pool): Extension<Pool<Postgres>>,
    Json(req): Json<PostContractsRequest>,
) -> Result<Json<Vec<Contract>>, StatusCode> {
    // Validate inputs are not empty
    if req.chain.trim().is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }
    if req.addrs.is_empty() || req.addrs.iter().any(|a| a.trim().is_empty()) {
        return Err(StatusCode::BAD_REQUEST);
    }

    // Get chain id, return error if invalid chain
    let chain_id =
        config::get_chain_id(&req.chain).ok_or(StatusCode::BAD_REQUEST)?;

    // TODO: periodically fetch contract from Etherscan if contract name, abi or source is empty

    // Fetch contracts stored in db
    let mut contracts = sqlx::query_as!(
        Contract,
        "SELECT chain, address, name, abi, label, NULL as src FROM contracts WHERE chain = $1 AND address = ANY($2)",
        req.chain, &req.addrs
    )
    .fetch_all(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let set: HashSet<String> =
        contracts.iter().map(|c| c.address.to_string()).collect();

    // Fetch contracts not stored in db from external source with rate limiting
    let mut vals: Vec<Contract> = vec![];
    let addrs_to_fetch: Vec<_> = req
        .addrs
        .iter()
        .filter(|addr| !set.contains(*addr))
        .collect();

    let delay = std::time::Duration::from_millis(
        (1000 / config::ETHERSCAN_RATE_LIMIT) + 1,
    );
    for addr in addrs_to_fetch {
        match etherscan::get_contract(chain_id, addr).await {
            Ok(res) => {
                vals.push(Contract {
                    chain: req.chain.to_string(),
                    address: res.addr,
                    name: res.name,
                    abi: res.abi,
                    label: None,
                    src: res.src,
                });
            }
            Err(e) => {
                info!("Failed to fetch contract {addr}: {e}");
            }
        }
        tokio::time::sleep(delay).await;
    }

    // Store contracts from external source into db (batch insert)
    if !vals.is_empty() {
        let chains: Vec<&str> = vals.iter().map(|v| v.chain.as_str()).collect();
        let addresses: Vec<&str> =
            vals.iter().map(|v| v.address.as_str()).collect();
        let names: Vec<Option<&str>> =
            vals.iter().map(|v| v.name.as_deref()).collect();
        let abis: Vec<Option<&Value>> =
            vals.iter().map(|v| v.abi.as_ref()).collect();
        let srcs: Vec<Option<&str>> =
            vals.iter().map(|v| v.src.as_deref()).collect();

        let inserted = sqlx::query_as!(
            Contract,
            r#"
                INSERT INTO contracts (chain, address, name, abi, src)
                SELECT * FROM UNNEST($1::text[], $2::text[], $3::text[], $4::jsonb[], $5::text[])
                ON CONFLICT (chain, address) DO UPDATE
                SET name = EXCLUDED.name, abi = EXCLUDED.abi, src = EXCLUDED.src
                RETURNING chain, address, name, abi, label, src
            "#,
            &chains as &[&str],
            &addresses as &[&str],
            &names as &[Option<&str>],
            &abis as &[Option<&Value>],
            &srcs as &[Option<&str>]
        )
        .fetch_all(&pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        contracts.extend(inserted);
    }

    Ok(Json(contracts))
}

// TODO: use - switch from using post_contracts to queue + query
#[derive(Serialize)]
struct PostJobResponse {
    job_id: String,
}

async fn post_contracts_job(
    Extension(pool): Extension<Pool<Postgres>>,
    Extension(jobs): Extension<Queue>,
    Json(req): Json<PostContractsRequest>,
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

    // Fetch contracts already in db
    let db_contracts: Vec<Contract> = sqlx::query_as!(
        Contract,
        "SELECT chain, address, name, abi, label, NULL as src FROM contracts WHERE chain = $1 AND address = ANY($2)",
        req.chain, &req.addrs
    )
    .fetch_all(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let set: HashSet<String> =
        db_contracts.iter().map(|c| c.address.clone()).collect();
    let addrs_to_fetch: Vec<String> = req
        .addrs
        .iter()
        .filter(|addr| !set.contains(*addr))
        .cloned()
        .collect();

    let job_id = uuid::Uuid::new_v4().to_string();

    // Initialize job with db contracts
    {
        let mut guard = jobs.write().await;
        guard.insert(
            job_id.clone(),
            Job {
                status: if addrs_to_fetch.is_empty() {
                    JobStatus::Complete
                } else {
                    JobStatus::Pending
                },
                contracts: db_contracts,
                total: addrs_to_fetch.len(),
                fetched: 0,
                created_at: std::time::Instant::now(),
            },
        );
    }

    if !addrs_to_fetch.is_empty() {
        let jobs = jobs.clone();
        let job_id = job_id.clone();
        let chain = req.chain.clone();
        let pool = pool.clone();

        tokio::spawn(async move {
            let delay = std::time::Duration::from_millis(
                (1000 / config::ETHERSCAN_RATE_LIMIT) + 1,
            );

            for addr in addrs_to_fetch {
                if let Ok(res) = etherscan::get_contract(chain_id, &addr).await
                {
                    let contract = Contract {
                        chain: chain.clone(),
                        address: res.addr.clone(),
                        name: res.name.clone(),
                        abi: res.abi.clone(),
                        label: None,
                        src: res.src.clone(),
                    };

                    // Insert into db
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
                    .execute(&pool)
                    .await;

                    // Update job
                    let mut guard = jobs.write().await;
                    if let Some(job) = guard.get_mut(&job_id) {
                        job.contracts.push(contract);
                        job.fetched += 1;
                        if job.fetched == job.total {
                            job.status = JobStatus::Complete;
                        }
                    }
                } else {
                    // Mark as fetched even on error
                    let mut guard = jobs.write().await;
                    if let Some(job) = guard.get_mut(&job_id) {
                        job.fetched += 1;
                        if job.fetched == job.total {
                            job.status = JobStatus::Complete;
                        }
                    }
                }

                tokio::time::sleep(delay).await;
            }
        });
    }

    Ok(Json(PostJobResponse { job_id }))
}

async fn poll_contracts_job(
    Extension(jobs): Extension<Queue>,
    Path(job_id): Path<String>,
) -> Result<Json<Job>, StatusCode> {
    let mut guard = jobs.read().await;
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
) -> Result<Json<Contract>, StatusCode> {
    // Validate inputs are not empty
    if chain.trim().is_empty() || addr.trim().is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    // TODO: return Option<Contract>?
    let contract = sqlx::query_as!(
        Contract,
        "SELECT chain, address, name, abi, label, src FROM contracts WHERE chain = $1 AND address = $2",
        chain, addr
    )
    .fetch_one(&pool)
    .await
    .map_err(|_| StatusCode::NOT_FOUND)?;

    Ok(Json(contract))
}
