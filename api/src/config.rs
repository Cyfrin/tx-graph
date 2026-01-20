use std::collections::HashMap;
use std::sync::LazyLock;

// requests per second
pub const ETHERSCAN_RATE_LIMIT: u64 = 3;

static CHAIN_IDS: LazyLock<HashMap<&'static str, u32>> = LazyLock::new(|| {
    HashMap::from([
        ("eth-mainnet", 1),
        ("eth-sepolia", 11155111),
        ("arb-mainnet", 42161),
        ("arb-sepolia", 421614),
        ("base-mainnet", 8453),
        ("base-sepolia", 84532),
        ("foundry-test", 0),
        ("hyperliquid-mainnet", 999),
        ("monad-mainnet", 10143),
        ("monad-testnet", 101431),
        ("unichain-mainnet", 130),
        ("unichain-sepolia", 1301),
        ("polygon-mainnet", 137),
        ("polygon-amoy", 80002),
        ("zksync-mainnet", 324),
        ("zksync-sepolia", 300),
    ])
});

pub fn get_chain_id(chain: &str) -> Option<u32> {
    CHAIN_IDS.get(chain).copied()
}
