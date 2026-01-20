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
use std::collections::HashSet;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing::{Level, info};
use tracing_subscriber;

mod config;
mod etherscan;

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

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST])
        .allow_headers([http::header::CONTENT_TYPE]);

    let app = Router::new()
        .route("/", get(health_check))
        .route("/contracts", post(post_contracts))
        .route("/contracts/{chain}/{address}", get(get_contract))
        .route("/fn-selectors/{selector}", get(get_fn_selectors))
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .layer(Extension(pool));

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

    // Fetch contracts not stored in db from external source
    let mut futs: FuturesUnordered<_> = req
        .addrs
        .iter()
        .filter(|p| !set.contains(*p))
        .map(|p| etherscan::get_contract(chain_id, p))
        .collect();

    let mut vals: Vec<Contract> = vec![];

    // FIX: need to request several times for all the contracts to show up
    while let Some(v) = futs.next().await {
        if let Ok(res) = v {
            vals.push(Contract {
                chain: req.chain.to_string(),
                address: res.addr,
                name: res.name,
                abi: res.abi,
                label: None,
                src: res.src,
            });
        }
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
