export type EtherscanContractInfo = {
  ABI: string
  ContractName: string
}

export type ContractInfo = {
  chain: string
  address: string
  name?: string
  abi?: any[]
  label?: string
}
