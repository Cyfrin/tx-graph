export type RpcConfig = {
  url: string
  chainId: number
  text: string
  test: boolean
}

export const RPC_CONFIG = {
  "foundry-test": {
    url: "",
    chainId: 0,
    text: "Foundry Test",
    test: true,
  },
  "eth-mainnet": {
    url: import.meta.env.VITE_ETH_MAINNET_RPC_URL,
    chainId: 1,
    text: "ETH",
    test: false,
  },
  "eth-sepolia": {
    url: import.meta.env.VITE_ETH_SEPOLIA_RPC_URL,
    chainId: 11155111,
    text: "ETH Sepolia",
    test: true,
  },
  "arb-mainnet": {
    url: import.meta.env.VITE_ARB_MAINNET_RPC_URL,
    chainId: 42161,
    text: "ARB One",
    test: false,
  },
  "arb-sepolia": {
    url: import.meta.env.VITE_ARB_SEPOLIA_RPC_URL,
    chainId: 421614,
    text: "ARB Sepolia",
    test: true,
  },
  "base-mainnet": {
    url: import.meta.env.VITE_BASE_MAINNET_RPC_URL,
    chainId: 8453,
    text: "Base",
    test: false,
  },
  "base-sepolia": {
    url: import.meta.env.VITE_BASE_SEPOLIA_RPC_URL,
    chainId: 84532,
    text: "Base Sepolia",
    test: true,
  },
  "hyperliquid-mainnet": {
    url: import.meta.env.VITE_HYPERLIQUID_MAINNET_RPC_URL,
    chainId: 999,
    text: "Hyperliquid",
    test: false,
  },
  "monad-mainnet": {
    url: import.meta.env.VITE_MONAD_MAINNET_RPC_URL,
    chainId: 10143,
    text: "Monad",
    test: false,
  },
  "monad-testnet": {
    url: import.meta.env.VITE_MONAD_TESTNET_RPC_URL,
    chainId: 10143_1,
    text: "Monad Testnet",
    test: true,
  },
  "unichain-mainnet": {
    url: import.meta.env.VITE_UNICHAIN_MAINNET_RPC_URL,
    chainId: 130,
    text: "Unichain",
    test: false,
  },
  "unichain-sepolia": {
    url: import.meta.env.VITE_UNICHAIN_SEPOLIA_RPC_URL,
    chainId: 1301,
    text: "Unichain Sepolia",
    test: true,
  },
  "polygon-mainnet": {
    url: import.meta.env.VITE_POLYGON_MAINNET_RPC_URL,
    chainId: 137,
    text: "Polygon",
    test: false,
  },
  "polygon-amoy": {
    url: import.meta.env.VITE_POLYGON_AMOY_RPC_URL,
    chainId: 80002,
    text: "Polygon Amoy",
    test: true,
  },
  "zksync-mainnet": {
    url: import.meta.env.VITE_ZKSYNC_MAINNET_RPC_URL,
    chainId: 324,
    text: "zkSync",
    test: false,
  },
  "zksync-sepolia": {
    url: import.meta.env.VITE_ZKSYNC_SEPOLIA_RPC_URL,
    chainId: 300,
    text: "zkSync Sepolia",
    test: true,
  },
}
