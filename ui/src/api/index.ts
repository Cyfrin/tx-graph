import { assert } from "../utils"
import { TxCall, ContractInfo } from "../types/tx"
import { CacheEntry, EtherscanContractInfo } from "./types"
import { post, get } from "./lib"
import { RPC_CONFIG } from "../config"

const DISABLE_CACHE = true
const CACHE_TTL = 5 * 60 * 1000
const CACHE_PREFIX = "txgraph_cache_"

// TODO: store somewhere else?
function getCached<T>(key: string): T | null {
  if (DISABLE_CACHE) {
    return null
  }
  try {
    const cacheKey = CACHE_PREFIX + key
    const item = localStorage.getItem(cacheKey)
    if (!item) return null

    const entry: CacheEntry<T> = JSON.parse(item)
    const now = Date.now()

    if (now - entry.timestamp > CACHE_TTL) {
      localStorage.removeItem(cacheKey)
      return null
    }

    return entry.data
  } catch (e) {
    console.error("Cache read error:", e)
    return null
  }
}

function setCache<T>(key: string, data: T): void {
  if (DISABLE_CACHE) {
    return
  }
  try {
    const cacheKey = CACHE_PREFIX + key
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    }
    localStorage.setItem(cacheKey, JSON.stringify(entry))
  } catch (e) {
    console.error("Cache write error:", e)
  }
}

export async function getTxTrace(
  chain: string,
  txHash: string,
): Promise<{ result: TxCall }> {
  const cacheKey = `tx:${chain}:${txHash}`
  const cached = getCached<{ result: TxCall }>(cacheKey)
  if (cached) {
    return cached
  }

  // @ts-ignore
  const cfg = RPC_CONFIG[chain]
  assert(cfg, `Config for ${chain} is empty`)

  const res = await post<any, { result: TxCall }>(cfg.url, {
    jsonrpc: "2.0",
    method: "debug_traceTransaction",
    params: [txHash, { tracer: "callTracer" }],
    id: cfg.chainId,
  })

  if (res?.result) {
    setCache(cacheKey, res)
  }

  return res
}

// TODO: remove chain_id, get chain id from chain
export async function getContracts(params: {
  chain: string
  chain_id: number
  addrs: string[]
}): Promise<ContractInfo[]> {
  // No caching for now
  return post<any, ContractInfo[]>(
    `${import.meta.env.VITE_API_URL}/contracts`,
    params,
  )
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
