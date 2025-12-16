export type Id = number

// Call graph
export type Call = {
  src: Id
  dst: Id
  depth: number
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
