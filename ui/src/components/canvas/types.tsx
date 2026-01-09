import { Id } from "./lib/types"

// UI
export type Hover = {
  node: Id | null
  // Set of Arrow.i
  arrows: Set<number> | null
}

export type Tracer = {
  hover: Id | null
  pins: Set<Id>
  hidden: Set<Id>
}
