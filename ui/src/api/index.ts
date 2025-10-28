import { post, get } from "./lib"
import { TxCall, EtherscanContractInfo, ContractInfo } from "./types"

// TODO: remove
import TX from "../../notes/data/tx-2.json"
import ABIS from "../../notes/data/abis.json"
import NAMES from "../../notes/data/names.json"

export async function getTxTrace(txHash: string): Promise<{ result: TxCall }> {
  return post<any, { result: TxCall }>(import.meta.env.VITE_RPC_URL, {
    jsonrpc: "2.0",
    method: "debug_traceTransaction",
    params: [txHash, { tracer: "callTracer" }],
    id: 1,
  })
  // @ts-ignore
  // return { result: TX.result }
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
  /*
  const contracts = ABIS.map((abi) => ({
    chain: "eth-mainnet",
    abi: abi.abi,
    // @ts-ignore
    name: NAMES[abi.addr],
    address: abi.addr,
  }))
  // @ts-ignore
  return contracts
  */
}
