import { post, get } from "./lib"
import { TxCall, EtherscanContractInfo, ContractInfo } from "./types"

// TODO: fix reloading page results in 404
export async function getTxTrace(txHash: string): Promise<{ result: TxCall }> {
  // TODO: remove
  console.log("DEBUG", import.meta.env)
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
  // TODO: remove
  console.log("DEBUG", import.meta.env)
  return post<any, ContractInfo[]>(
    `${import.meta.env.VITE_API_URL}/contracts`,
    params,
  )
}
