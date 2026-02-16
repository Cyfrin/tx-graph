import { assert } from "../utils"
import * as TxTypes from "../types/tx"
import { CacheEntry, EtherscanContractInfo, Job } from "./types"
import { post, get } from "./lib"
import { RPC_CONFIG } from "../config"

const DISABLE_CACHE = !import.meta.env.PROD
const CACHE_TTL = 60 * 1000
const CACHE_PREFIX = "txgraph_cache_"

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
  rpcUrl?: string,
): Promise<{ result: TxTypes.TxCall }> {
  const cacheKey = `tx:${chain}:${txHash}`
  const cached = getCached<{ result: TxTypes.TxCall }>(cacheKey)
  if (cached) {
    return cached
  }

  // @ts-ignore
  const cfg = RPC_CONFIG[chain]
  const url = rpcUrl || cfg?.url
  assert(url, `RPC URL for ${chain} is empty`)

  const res = await post<any, { result: TxTypes.TxCall }>(url, {
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

export async function postJobs(params: {
  chain: string
  addrs: string[]
}): Promise<{ job_ids: string[]; contracts: TxTypes.ContractInfo[] }> {
  return post<any, { job_ids: string[]; contracts: TxTypes.ContractInfo[] }>(
    `${import.meta.env.VITE_API_URL}/contracts`,
    params,
  )
}

export async function getJobs(params: {
  job_ids: string[]
}): Promise<Record<string, Job>> {
  return post<any, Record<string, Job>>(
    `${import.meta.env.VITE_API_URL}/contracts/q`,
    params,
  )
}

export async function getContract(params: {
  chain: string
  addr: string
}): Promise<TxTypes.ContractInfo | null> {
  return get<TxTypes.ContractInfo | null>(
    `${import.meta.env.VITE_API_URL}/contracts/${params.chain}/${params.addr}`,
  )
}

export async function batchGetContracts(params: {
  chain: string
  addrs: string[]
}): Promise<
  Record<string, { name: string | null; src: TxTypes.Source | null } | null>
> {
  const res = await Promise.all(
    params.addrs.map((addr) => getContract({ chain: params.chain, addr })),
  )

  // TODO: include name
  return params.addrs.reduce(
    (z, addr, i) => {
      if (res[i]?.src) {
        try {
          // Remove extra { and }
          const s = res[i].src.slice(1, -1)
          z[addr] = {
            name: res[i].name || null,
            src: JSON.parse(s),
          }
          return z
        } catch (error) {
          console.log("JSON parse error:", addr, error)
        }
      }

      z[addr] = null
      return z
    },
    {} as Record<
      string,
      { name: string | null; src: TxTypes.Source | null } | null
    >,
  )
}

export async function getEtherscanContract(
  addr: string,
  chain: any,
  apiKey?: string,
): Promise<{ abi: any | null; name: string | null }> {
  const key = apiKey || import.meta.env.VITE_ETHERSCAN_API_KEY
  const cfg = RPC_CONFIG[chain as keyof typeof RPC_CONFIG]
  const chainId = cfg?.chainId
  const res = await get<{ result: EtherscanContractInfo[] }>(
    `https://api.etherscan.io/v2/api?chainid=${chainId}&module=contract&action=getsourcecode&address=${addr}&apikey=${key}`,
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
