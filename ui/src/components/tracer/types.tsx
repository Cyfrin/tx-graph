export type Id = number

export type Input = {
  type: string
  name: string
  value: string
}

export type Output = {
  type: string
  name: string
  value: string
}

export type Fn = {
  id: Id
  mod: Id
  name: string
}

export type Trace<C> = {
  // Call index
  i: number
  depth: number
  fn: Fn
  inputs: Input[]
  outputs: Output[]
  // TODO: ok + error?
  calls: Trace<C>[]
  ctx: C
}
