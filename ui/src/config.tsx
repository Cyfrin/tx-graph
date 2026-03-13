import React from "react"
// Icons
import Eth from "./components/svg/chains/Eth"
import Arbitrum from "./components/svg/chains/Arbitrum"
import Base from "./components/svg/chains/Base"
import HyperLiquid from "./components/svg/chains/HyperLiquid"
import Monad from "./components/svg/chains/Monad"
import Unichain from "./components/svg/chains/Unichain"
import Polygon from "./components/svg/chains/Polygon"
import ZkSync from "./components/svg/chains/ZkSync"
import Foundry from "./components/svg/chains/Foundry"
import Optimism from "./components/svg/chains/Optimism"

export type RpcConfig = {
  url: string
  chainId: number
  text: string
  test: boolean
  blockscan?: string
  icon?: React.FC<{
    size: number
    color?: string
    className?: string
    onClick?: (e: React.MouseEvent) => void
  }>
}

export const RPC_CONFIG = {
  "foundry-test": {
    url: "",
    chainId: 0,
    text: "Foundry Test",
    test: true,
    icon: Foundry,
  },
  "eth-mainnet": {
    url: import.meta.env.VITE_ETH_MAINNET_RPC_URL,
    chainId: 1,
    text: "ETH",
    test: false,
    blockscan: "ethereum",
    icon: Eth,
  },
  "eth-sepolia": {
    url: import.meta.env.VITE_ETH_SEPOLIA_RPC_URL,
    chainId: 11155111,
    text: "ETH Sepolia",
    test: true,
    blockscan: "sepolia",
    icon: Eth,
  },
  "arb-mainnet": {
    url: import.meta.env.VITE_ARB_MAINNET_RPC_URL,
    chainId: 42161,
    text: "ARB One",
    test: false,
    blockscan: "arbitrum",
    icon: Arbitrum,
  },
  "arb-sepolia": {
    url: import.meta.env.VITE_ARB_SEPOLIA_RPC_URL,
    chainId: 421614,
    text: "ARB Sepolia",
    test: true,
    blockscan: "arbitrum-sepolia",
    icon: Arbitrum,
  },
  "base-mainnet": {
    url: import.meta.env.VITE_BASE_MAINNET_RPC_URL,
    chainId: 8453,
    text: "Base",
    test: false,
    blockscan: "base",
    icon: Base,
  },
  "base-sepolia": {
    url: import.meta.env.VITE_BASE_SEPOLIA_RPC_URL,
    chainId: 84532,
    text: "Base Sepolia",
    test: true,
    blockscan: "base-sepolia",
    icon: Base,
  },
  "hyperliquid-mainnet": {
    url: import.meta.env.VITE_HYPERLIQUID_MAINNET_RPC_URL,
    chainId: 999,
    text: "Hyperliquid",
    test: false,
    icon: HyperLiquid,
  },
  "monad-mainnet": {
    url: import.meta.env.VITE_MONAD_MAINNET_RPC_URL,
    chainId: 10143,
    text: "Monad",
    test: false,
    icon: Monad,
  },
  "monad-testnet": {
    url: import.meta.env.VITE_MONAD_TESTNET_RPC_URL,
    chainId: 10143_1,
    text: "Monad Testnet",
    test: true,
    icon: Monad,
  },
  "unichain-mainnet": {
    url: import.meta.env.VITE_UNICHAIN_MAINNET_RPC_URL,
    chainId: 130,
    text: "Unichain",
    test: false,
    icon: Unichain,
  },
  "unichain-sepolia": {
    url: import.meta.env.VITE_UNICHAIN_SEPOLIA_RPC_URL,
    chainId: 1301,
    text: "Unichain Sepolia",
    test: true,
    icon: Unichain,
  },
  "polygon-mainnet": {
    url: import.meta.env.VITE_POLYGON_MAINNET_RPC_URL,
    chainId: 137,
    text: "Polygon",
    test: false,
    blockscan: "polygon",
    icon: Polygon,
  },
  "polygon-amoy": {
    url: import.meta.env.VITE_POLYGON_AMOY_RPC_URL,
    chainId: 80002,
    text: "Polygon Amoy",
    test: true,
    icon: Polygon,
  },
  "optimism-mainnet": {
    url: import.meta.env.VITE_OPTIMISM_MAINNET_RPC_URL,
    chainId: 10,
    text: "Optimism",
    test: false,
    blockscan: "optimistic",
    icon: Optimism,
  },
  "optimism-sepolia": {
    url: import.meta.env.VITE_OPTIMISM_SEPOLIA_RPC_URL,
    chainId: 11155420,
    text: "Optimism Sepolia",
    test: true,
    blockscan: "optimism-sepolia",
    icon: Optimism,
  },
  "zksync-mainnet": {
    url: import.meta.env.VITE_ZKSYNC_MAINNET_RPC_URL,
    chainId: 324,
    text: "zkSync",
    test: false,
    blockscan: "zksync",
    icon: ZkSync,
  },
  "zksync-sepolia": {
    url: import.meta.env.VITE_ZKSYNC_SEPOLIA_RPC_URL,
    chainId: 300,
    text: "zkSync Sepolia",
    test: true,
    blockscan: "zksync-sepolia",
    icon: ZkSync,
  },
}
