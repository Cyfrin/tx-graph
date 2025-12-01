import { post, get } from "./lib"
import { TxCall, EtherscanContractInfo, ContractInfo } from "./types"

export const RPC_URLS = {
  "eth-mainnet": import.meta.env.VITE_ETH_MAINNET_RPC_URL,
  "eth-sepolia": import.meta.env.VITE_ETH_SEPOLIA_RPC_URL,
  "arb-mainnet": import.meta.env.VITE_ARB_MAINNET_RPC_URL,
  "arb-sepolia": import.meta.env.VITE_ARB_SEPOLIA_RPC_URL,
  "base-mainnet": import.meta.env.VITE_BASE_MAINNET_RPC_URL,
  "base-sepolia": import.meta.env.VITE_BASE_SEPOLIA_RPC_URL,
  //"bnb-mainnet": import.meta.env.VITE_BNB_MAINNET_RPC_URL,
  // "bnb-testnet": import.meta.env.VITE_BNB_TESTNET_RPC_URL,
  //"opt-mainnet": import.meta.env.VITE_OPT_MAINNET_RPC_URL,
  //"opt-sepolia": import.meta.env.VITE_OPT_SEPOLIA_RPC_URL,
  "hyperliquid-mainnet": import.meta.env.VITE_HYPERLIQUID_MAINNET_RPC_URL,
  "monad-mainnet": import.meta.env.VITE_MONAD_MAINNET_RPC_URL,
  "monad-testnet": import.meta.env.VITE_MONAD_TESTNET_RPC_URL,
  "unichain-mainnet": import.meta.env.VITE_UNICHAIN_MAINNET_RPC_URL,
  "unichain-sepolia": import.meta.env.VITE_UNICHAIN_SEPOLIA_RPC_URL,
  "polygon-mainnet": import.meta.env.VITE_POLYGON_MAINNET_RPC_URL,
  "polygon-amoy": import.meta.env.VITE_POLYGON_AMOY_RPC_URL,
  "zksync-mainnet": import.meta.env.VITE_ZKSYNC_MAINNET_RPC_URL,
  "zksync-sepolia": import.meta.env.VITE_ZKSYNC_SEPOLIA_RPC_URL,
}

// TODO: fix reloading page results in 404
export async function getTxTrace(txHash: string): Promise<{ result: TxCall }> {
  return post<any, { result: TxCall }>(import.meta.env.VITE_RPC_URL, {
    jsonrpc: "2.0",
    method: "debug_traceTransaction",
    params: [txHash, { tracer: "callTracer" }],
    id: 1,
  })
}

export async function getEtherscanContract(
  addr: string,
): Promise<{ abi: any | null; name: string | null }> {
  const res = await get<{ result: EtherscanContractInfo[] }>(
    `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${addr}&apikey=${import.meta.env.VITE_ETHERSCAN_API_KEY}`,
  )

  // @ts-ignore
  const abi = res?.result?.[0]?.ABI || ""
  // @ts-ignore
  const name = res?.result?.[0]?.ContractName || null

  const parse = (abi: string) => {
    try {
      return JSON.parse(abi)
    } catch (e) {
      return null
    }
  }

  return { abi: parse(abi), name }
}

// TODO: remove chain_id, get chain id from chain
export async function getContracts(params: {
  chain: string
  chain_id: number
  addrs: string[]
}): Promise<ContractInfo[]> {
  return post<any, ContractInfo[]>(
    `${import.meta.env.VITE_API_URL}/contracts`,
    params,
  )
}
