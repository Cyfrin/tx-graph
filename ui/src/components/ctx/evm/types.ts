import { Id, FnDef } from "../../tracer/types"

// Contract and EOA
export type Account = {
  name?: string
  addr: string
  fns: Map<Id, FnDef>
}

export type Evm = {
  // Name of dst contract or account
  name?: string
  src: string
  dst: string
  val?: bigint
  // call, staticcall, delegatecall, event, etc...
  type: string
  raw?: {
    input?: string
    output?: string
  }
  selector?: string
  gas?: bigint
}
