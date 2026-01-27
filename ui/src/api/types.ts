import { ContractInfo } from "../types/tx"

export type EtherscanContractInfo = {
  ABI: string
  ContractName: string
}

export type CacheEntry<T> = {
  data: T
  timestamp: number
}

export type Job = {
  status: "pending" | "complete"
  contract: ContractInfo | null
}
