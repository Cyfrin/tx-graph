import * as TxTypes from "../types/tx"

export type JsonFile = {
  abi: TxTypes.AbiEntry[]
  bytecode: {
    object: string
  }
  deployedBytecode: {
    object: string
    immutableReferences?: Record<
      string,
      Array<{ start: number; length: number }>
    >
  }
  // func sig => selector
  methodIdentifiers: Record<string, string>
}

export type Trace = {
  depth: number
  success: boolean
  caller: string
  address: string
  kind: "CREATE" | "CREATE2" | "CALL" | "DELEGATECALL" | "STATICCALL"
  value: string
  data: string
  output: string
  gas_limit: number
  gas_used: number
}

export type Arena = {
  trace: Trace
  idx: number
  parent: number | null
  children: number[]
}

export type LifeCycle = "Deployment" | "Setup" | "Execution"

export type Test = {
  status: "Success" | ""
  traces: [LifeCycle, { arena: Arena[] }][]
  // Address => label
  labeled_addresses?: Record<string, string>
  // TODO: logs
  decoded_logs: string[]
}

// Test contract name => test name => Test
export type Tests = Record<string, { test_results: Record<string, Test> }>
