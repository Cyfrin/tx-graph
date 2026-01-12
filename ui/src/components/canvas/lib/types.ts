export type Id = number

// Call graph
export type Call<A> = {
  src: Id
  dst: Id
  depth: number
  ctx?: A
}

// Group id => ids
export type Groups = Map<Id, Set<Id>>

// Reverse look up
// Id => group id
export type Rev = Map<Id, Id>

// Directed graph
export type Neighbors = Map<Id, Set<Id>>

export type Graph = {
  // Child => parents
  incoming: Neighbors
  // Parent => children
  outgoing: Neighbors
}

// SVG
export type Point = {
  x: number
  y: number
}

export type Rect = {
  // left
  x: number
  // top
  y: number
  width: number
  height: number
}

export type MidPoints = {
  top: Point
  left: Point
  bottom: Point
  right: Point
  center: Point
}

export type Canvas = {
  graph: CanvasRenderingContext2D | null
  ui: CanvasRenderingContext2D | null
}

export type Screen = {
  width: number
  height: number
  center: Point
  node: {
    width: number
    height: number
    // Space between 2 nodes
    gap: { x: number; y: number }
  }
}

export type Arrow = {
  // Call index
  i: number
  // Starting node id
  s: Id
  // Ending node id
  e: Id
  p0: Point
  p1: Point
}

export type Node = {
  id: Id
  rect: Rect
}

export type Layout = {
  rect: Rect
  nodes: Map<Id, Node>
  arrows: Arrow[]
  rev: Rev
}

// UI
export type Hover = {
  node: Id | null
  // Set of Arrow id
  arrows: Set<Id> | null
}

export type Tracer = {
  hover: Id | null
  pins: Set<Id>
  hidden: Set<Id>
}
