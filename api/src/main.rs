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
use sqlx::{Pool, Postgres, postgres::PgPoolOptions};
use std::collections::HashSet;
use tower_http::cors::{Any, CorsLayer};
use tracing::{Level, info};
use tracing_subscriber;

mod etherscan;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();

    let host = std::env::var("HOST")?;
    let port = std::env::var("PORT").unwrap_or("8080".to_string());
    let db_url = std::env::var("DATABASE_URL")?;

    // let pool = PgPoolOptions::new().connect(&db_url).await?;
    info!("Connected to database");

    tracing_subscriber::fmt().with_max_level(Level::INFO).init();

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST])
        .allow_headers([http::header::CONTENT_TYPE]);

    // TODO: request logs
    let app = Router::new()
        .route("/", get(health_check))
        // .route("/contracts", post(post_contracts))
        // .route("/contracts/{chain}/{address}", get(get_contract))
        // .route("/fn-selectors/{selector}", get(get_fn_selectors))
        .layer(cors);
    // .layer(Extension(pool));

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

/*
#[derive(Debug, Serialize, Deserialize)]
struct Contract {
    chain: String,
    address: String,
    name: Option<String>,
    abi: Option<Value>,
    label: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct PostContractsRequest {
    chain: String,
    chain_id: u32,
    addrs: Vec<String>,
}

// #[debug_handler]
async fn post_contracts(
    Extension(pool): Extension<Pool<Postgres>>,
    Json(req): Json<PostContractsRequest>,
) -> Result<Json<Vec<Contract>>, StatusCode> {
    // TODO: validate chain and address
    // TODO: get chain id from chain

    // Fetch contracts stored in db
    let mut contracts = sqlx::query_as!(
        Contract,
        "SELECT chain, address, name, abi, label FROM contracts WHERE chain = $1 AND address = ANY($2)",
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
        .map(|p| etherscan::get_contract(req.chain_id, p))
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
            });
        }
    }

    // Store contracts from external source into db
    //TODO: batch
    for v in vals {
        let res = sqlx::query_as!(
            Contract,
            r#"
                INSERT INTO contracts (chain, address, name, abi)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (chain, address) DO UPDATE
                SET name = EXCLUDED.name, abi = EXCLUDED.abi
                RETURNING chain, address, name, abi, label
            "#,
            v.chain,
            v.address,
            v.name,
            v.abi
        )
        .fetch_one(&pool)
        .await;

        if let Ok(contract) = res {
            contracts.push(contract);
        }
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
    // TODO: validate selector
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
    // TODO: validate chain and addr
    // TODO: return Option<Contract>?
    let contract = sqlx::query_as!(
        Contract,
        "SELECT chain, address, name, abi, label FROM contracts WHERE chain = $1 AND address = $2",
        chain, addr
    )
    .fetch_one(&pool)
    .await
    .map_err(|_| StatusCode::NOT_FOUND)?;

    Ok(Json(contract))
}
*/
