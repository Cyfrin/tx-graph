import {
  Id,
  Call,
  Groups,
  Rev,
  Point,
  Rect,
  MidPoints,
  Arrow,
  Screen,
  Node,
  Layout,
} from "./types"
import { assert } from "./utils"

export function isInside(p: Point, rect: Rect): boolean {
  return (
    p.x >= rect.x &&
    p.x <= rect.x + rect.width &&
    p.y >= rect.y &&
    p.y <= rect.y + rect.height
  )
}

export function box(points: Point[], xPad: number = 0, yPad: number = 0): Rect {
  let xMin = points[0].x
  let xMax = points[0].x
  let yMin = points[0].y
  let yMax = points[0].y

  for (let i = 1; i < points.length; i++) {
    const p = points[i]
    if (p.x < xMin) {
      xMin = p.x
    }
    if (p.y < yMin) {
      yMin = p.y
    }
    if (p.x > xMax) {
      xMax = p.x
    }
    if (p.y > yMax) {
      yMax = p.y
    }
  }

  return {
    x: xMin - xPad,
    y: yMin - yPad,
    width: xMax - xMin + 2 * xPad,
    height: yMax - yMin + 2 * yPad,
  }
}

export function getMidPoints(rect: Rect): MidPoints {
  const mw = rect.width >> 1
  const mh = rect.height >> 1

  return {
    top: {
      x: rect.x + mw,
      y: rect.y,
    },
    bottom: {
      x: rect.x + mw,
      y: rect.y + rect.height,
    },
    left: {
      x: rect.x,
      y: rect.y + mh,
    },
    right: {
      x: rect.x + rect.width,
      y: rect.y + mh,
    },
    center: {
      x: rect.x + mw,
      y: rect.y + mh,
    },
  }
}

function arrow(nodes: Map<Id, Node>, i: number, start: Id, end: Id): Arrow {
  const s = nodes.get(start) as Node
  const e = nodes.get(end) as Node

  const m0 = getMidPoints(s.rect)
  const m1 = getMidPoints(e.rect)

  let p0 = { x: 0, y: 0 }
  let p1 = { x: 0, y: 0 }

  if (m0.center.x < m1.center.x) {
    // Call forward
    p0 = m0.right
    p1 = m1.left
  } else {
    // Call back
    p0 = m0.right
    p1 = m1.top
  }

  return {
    i,
    s: s.id,
    e: e.id,
    p0,
    p1,
  }
}

export function map<A, F>(
  groups: Groups,
  calls: Call<A, F>[],
  screen: Screen,
): Layout {
  const nodes: Map<Id, Node> = new Map()
  // Reverse look up call.src or call.dst to group id
  const rev: Rev = new Map()

  // Calculate group width and height
  for (const [g, fs] of groups) {
    const node = {
      id: g,
      rect: {
        x: 0,
        y: 0,
        width: screen.node.width,
        height: screen.node.height * (fs.size + 1),
      },
    }
    nodes.set(g, node)

    for (const f of fs.values()) {
      rev.set(f, g)
    }
  }

  // Calculate group x position based on min call depth
  // Calculate group y position based on call index
  // Group id => depth
  const xOffsets: Map<Id, number> = new Map()
  // Depth => y offset
  const yOffsets: Map<number, number> = new Map()

  for (let i = 0; i < calls.length; i++) {
    const c = calls[i]
    // src and dst group ids (src for i = 0, is not a function)
    const src = (i == 0 ? c.src : rev.get(c.src)) as Id
    const dst = rev.get(c.dst) as Id
    assert(src != undefined, `missing group for src ${c.src}`)
    assert(dst != undefined, `missing group for dst ${c.dst}`)

    if (!xOffsets.has(src)) {
      const d = c.depth
      xOffsets.set(src, d)

      const node = nodes.get(src) as Node
      const x0 = d * (node.rect.width + screen.node.gap.x)
      const y0 = yOffsets.get(d) ?? 0
      node.rect.x = x0
      node.rect.y = y0

      // Next node at this depth is rendered below this node
      const y1 = y0 + node.rect.height + screen.node.gap.y
      yOffsets.set(d, y1)
      // Nodes to be rendered at next depth is aligned to this node's top y position
      yOffsets.set(d + 1, Math.max(yOffsets.get(d + 1) ?? 0, y0))
      // Nodes to be rendered at previous depths are shifted up to
      // this node's bottom y position or yMax
      let yMax = y0
      for (let i = 0; i <= d - 1; i++) {
        yMax = Math.max(yOffsets.get(i) ?? 0, yMax)
      }
      for (let i = 0; i <= d - 1; i++) {
        yOffsets.set(i, yMax)
      }
    }
    if (!xOffsets.has(dst)) {
      const d = c.depth + 1
      xOffsets.set(dst, d)

      const node = nodes.get(dst) as Node
      const x0 = d * (node.rect.width + screen.node.gap.x)
      const y0 = yOffsets.get(d) ?? 0
      node.rect.x = x0
      node.rect.y = y0

      // Same algorithm as yOffsets for src
      const y1 = y0 + node.rect.height + screen.node.gap.y
      yOffsets.set(d, y1)
      yOffsets.set(d + 1, Math.max(yOffsets.get(d + 1) ?? 0, y0))

      let yMax = y0
      for (let i = 0; i <= d - 1; i++) {
        yMax = Math.max(yOffsets.get(i) ?? 0, yMax)
      }
      for (let i = 0; i <= d - 1; i++) {
        yOffsets.set(i, yMax)
      }
    }
  }

  // Shift initial caller's y position down by 1 node height
  if (calls.length > 0) {
    const node = nodes.get(calls[0].src) as Node
    node.rect.y += screen.node.height
  }

  // Position nodes to center of the screen
  let xMax = 0
  let yMax = 0
  for (const [_, node] of nodes) {
    xMax = Math.max(xMax, getMidPoints(node.rect).right.x)
    yMax = Math.max(yMax, getMidPoints(node.rect).bottom.y)
  }

  const x0 = screen.center.x - (xMax >> 1)
  const y0 = screen.center.y - (yMax >> 1)
  for (const [_, node] of nodes) {
    node.rect.x += x0
    node.rect.y += y0
  }

  // Calculate function positions
  for (const [g, fs] of groups) {
    const group = nodes.get(g) as Node
    assert(group != undefined, `group undefined: ${g}`)
    let i = 0
    for (const f of fs) {
      nodes.set(f, {
        id: f,
        rect: {
          x: group.rect.x,
          y: group.rect.y + (i + 1) * screen.node.height,
          width: screen.node.width,
          height: screen.node.height,
        },
      })
      i++
    }
  }

  const arrows: Arrow[] = []
  for (let i = 0; i < calls.length; i++) {
    const c = calls[i]
    arrows.push(arrow(nodes, i, c.src, c.dst))
  }

  return {
    rect: {
      x: x0,
      y: y0,
      width: xMax,
      height: yMax,
    },
    nodes,
    arrows,
    rev,
  }
}
