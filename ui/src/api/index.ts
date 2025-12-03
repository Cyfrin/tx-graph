import { assert } from "../utils"
import { TxCall } from "../types/tx"
import { EtherscanContractInfo, ContractInfo } from "./types"
import { post, get } from "./lib"
import { RPC_CONFIG } from "../config"

export async function getTxTrace(
  chain: string,
  txHash: string,
): Promise<{ result: TxCall }> {
  // @ts-ignore
  const cfg = RPC_CONFIG[chain]
  assert(cfg, `Config for ${chain} is empty`)

  return post<any, { result: TxCall }>(cfg.url, {
    jsonrpc: "2.0",
    method: "debug_traceTransaction",
    params: [txHash, { tracer: "callTracer" }],
    id: cfg.chainId,
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
