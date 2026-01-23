export type Id = number

export type Input = {
  type: string
  name: string
  val: string
}

export type Output = {
  type: string
  name: string
  val: string
}

export type FnCall = {
  id: Id
  mod: Id
  name: string
  inputs: Input[]
  outputs: Output[]
}

export type InputDef = {
  type: string
  name: string
}

export type OutputDef = {
  type: string
  name: string
}

export type FnDef = {
  id: Id
  mod: Id
  name: string
  inputs: InputDef[]
  outputs: OutputDef[]
}

export type Trace<C> = {
  // Call index
  i: number
  depth: number
  fn: FnCall
  // TODO: ok + error?
  calls: Trace<C>[]
  ctx: C
}

export type Call<C, F> = {
  // Call index
  i: number
  src: Id
  dst: Id
  depth: number
  ctx: C
  fn: F
}
