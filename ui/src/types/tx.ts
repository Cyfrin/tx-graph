export type TxCall = {
  from: string
  to: string
  type: "CREATE" | "CALL" | "DELEGATECALL" | "STATICCALL"
  input: string
  output?: string
  gas: string
  gasUsed: string
  value: string
  calls?: TxCall[]
}

export type AbiInput = {
  type: string
  name: string
}

export type AbiOutput = {
  type: string
  name: string
}

export type AbiEntry = {
  type: string
  name?: string
  inputs?: AbiInput[]
  outputs?: AbiOutput[]
}

export type ContractInfo = {
  chain: string
  address: string
  name?: string
  abi?: AbiEntry[]
  label?: string
}
