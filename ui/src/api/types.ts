export type TxCall = {
  from: string
  to: string
  type: "CALL" | "DELEGATECALL" | "STATICCALL"
  input: string
  output?: string
  gas: string
  gasUsed: string
  value: string
  calls?: TxCall[]
}

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
