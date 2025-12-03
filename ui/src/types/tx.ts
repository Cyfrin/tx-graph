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
