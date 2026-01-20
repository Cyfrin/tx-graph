use reqwest::Client;
use serde::Deserialize;
use serde_json::Value;
use std::env;
use tracing::info;

#[derive(Debug, Deserialize)]
struct ContractInfo {
    #[serde(rename = "ABI")]
    abi: String,
    #[serde(rename = "ContractName")]
    contract_name: Option<String>,
    #[serde(rename = "SourceCode")]
    source_code: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(untagged)]
enum ResponseResult {
    Contracts(Vec<ContractInfo>),
    Error(String),
}

#[derive(Debug, Deserialize)]
struct Response {
    status: Option<String>,
    message: Option<String>,
    result: ResponseResult,
}

#[derive(Debug)]
pub struct Contract {
    pub addr: String,
    pub name: Option<String>,
    pub abi: Option<Value>,
    pub src: Option<String>,
}

pub async fn get_contract(
    chain_id: u32,
    addr: &str,
) -> Result<Contract, Box<dyn std::error::Error>> {
    let api_key = env::var("ETHERSCAN_API_KEY")?;

    let url = format!(
        "https://api.etherscan.io/v2/api?chainid={}&module=contract&action=getsourcecode&address={}&apikey={}",
        chain_id, addr, api_key
    );

    let client = Client::new();
    let res = client.get(&url).send().await?;

    let status = res.status();
    let body = res.text().await?;

    if !status.is_success() {
        info!("HTTP {status} for {addr}: {body}");
        return Err(format!("HTTP {status}").into());
    }

    let res: Response = serde_json::from_str(&body)?;

    let contracts = match res.result {
        ResponseResult::Contracts(c) => c,
        ResponseResult::Error(e) => {
            info!("Etherscan error for {addr}: {e}");
            return Err(e.into());
        }
    };

    let first = contracts.first();

    let name = first.and_then(|c| c.contract_name.clone());

    let abi_raw = first.map(|c| c.abi.clone()).unwrap_or_default();
    let abi = serde_json::from_str(&abi_raw).ok();

    let src = first.and_then(|c| c.source_code.clone());

    Ok(Contract {
        addr: addr.to_string(),
        name,
        abi,
        src,
    })
}
