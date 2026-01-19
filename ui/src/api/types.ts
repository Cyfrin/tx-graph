export type EtherscanContractInfo = {
  ABI: string
  ContractName: string
}

export type CacheEntry<T> = {
  data: T
  timestamp: number
}
