use reqwest::Client;
use serde::Deserialize;
use serde_json::Value;
use std::env;

#[derive(Debug, Deserialize)]
struct ContractInfo {
    #[serde(rename = "ABI")]
    abi: String,
    #[serde(rename = "ContractName")]
    contract_name: Option<String>,
}

#[derive(Debug, Deserialize)]
struct Response {
    result: Vec<ContractInfo>,
}

#[derive(Debug)]
pub struct Contract {
    pub addr: String,
    pub name: Option<String>,
    pub abi: Option<Value>,
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
    let res: Response = client.get(&url).send().await?.json().await?;

    let first = res.result.get(0);

    let name = first.and_then(|c| c.contract_name.clone());

    let abi_raw = first.map(|c| c.abi.clone()).unwrap_or_default();
    let abi = serde_json::from_str(&abi_raw).ok();

    Ok(Contract {
        addr: addr.to_string(),
        name,
        abi,
    })
}
