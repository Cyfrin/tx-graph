import React, { useState, useMemo, useRef, useEffect } from "react"
import { Canvas, Groups, Call, Point, Node, Arrow, Rect } from "./lib/types"
import * as screen from "./lib/screen"
import * as math from "./lib/math"
import { draw } from "./lib/canvas"
import { Hover, Tracer } from "./types"

const STYLE: React.CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
}

const DEFAULT_NODE_FILL = "none"
const DEFAULT_NODE_STROKE = "black"

const ZOOMS: number[] = [
  0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6,
  1.7, 1.8, 1.9, 2.0,
]
const MIN_ZOOM_INDEX = 0
const MAX_ZOOM_INDEX = ZOOMS.length - 1

const STEP = 50
const MIN_STEPS = 4
// Radius around mouse
const R = 25
const BOX_X_PADD = 10
const BOX_Y_PADD = 10

export type ArrowType = "arrow" | "zigzag" | "callback"

export function getArrowType(p0: Point, p1: Point): ArrowType {
  if (p0.y == p1.y) {
    return "arrow"
  }
  if (p1.x <= p0.x) {
    return "callback"
  }
  return "zigzag"
}

function poly(
  p0: Point,
  p1: Point,
  xPad: number = 0,
  yPad: number = 0,
): Point[] {
  const type = getArrowType(p0, p1)
  switch (type) {
    case "zigzag": {
      const mid = (p0.x + p1.x) >> 1
      return [p0, { x: mid, y: p0.y }, { x: mid, y: p1.y }, p1]
    }
    case "callback": {
      return [
        p0,
        { x: p0.x + xPad, y: p0.y },
        { x: p0.x + xPad, y: p1.y + yPad },
        { x: p1.x, y: p1.y + yPad },
        p1,
      ]
    }
    default:
      return [p0, p1]
  }
}

function sample(a: Arrow, xPad: number = 0, yPad: number = 0): Point[] {
  const ps = poly(a.p0, a.p1, xPad, yPad)
  const [len] = math.len(ps)

  const n = Math.max(len > STEP ? (len / STEP) | 0 : MIN_STEPS, MIN_STEPS)

  return math.sample(n, (i) => {
    const t = i / n
    return math.perp(ps, t)
  })
}

function getCanvasX(
  // Screen coordinates
  width: number,
  mouseX: number,
  // Canvas coordinates
  canvasWidth: number,
  canvasX: number,
): number {
  return math.lin(canvasWidth, width, mouseX, canvasX)
}

function getCanvasY(
  // Screen coordinates
  height: number,
  mouseY: number,
  // Canvas coordinates
  canvasHeight: number,
  canvasY: number,
): number {
  return math.lin(canvasHeight, height, mouseY, canvasY)
}

function box(points: Point[], xPad: number = 0, yPad: number = 0): Rect {
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

type Refs = {
  graph: HTMLCanvasElement | null
  ui: HTMLCanvasElement | null
  // animation frame
  anim: number | null
  // NOTE: store params as ref for animate to draw with latest params
  mouse: Point | null
  zoomIndex: number
  view: {
    x: number
    y: number
    width: number
    height: number
  }
  drag: {
    startMouseX: number
    startMouseY: number
    startViewX: number
    startViewY: number
  } | null
  hover: Hover | null
}

export type Props = {
  width: number
  height: number
  backgroundColor: string
  groups: Groups
  calls: Call[]
  tracer?: Tracer
  getNodeStyle: (
    hover: Hover | null,
    node: Node,
  ) => { fill?: string; stroke?: string }
  getNodeText: (hover: Hover | null, node: Node) => string
  nodeWidth?: number
  nodeHeight?: number
  nodeXGap?: number
  nodeYGap?: number
  /*
  onMouseMove?: (
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
    mouse: Point | null,
    layout: Layout,
    xRange: XRange | null,
  ) => void
  onMouseOut?: (
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
    mouse: Point | null,
    layout: Layout,
  ) => void
  onMouseDown?: (
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
    mouse: Point | null,
    layout: Layout,
  ) => void
  onMouseUp?: (
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
    mouse: Point | null,
    layout: Layout,
  ) => void
  onWheel?: (
    e: React.WheelEvent<HTMLCanvasElement>,
    mouse: Point | null,
    layout: Layout,
    xRange: XRange | null,
  ) => void
  */
}

/*
function getMouse(
  ctx: Canvas,
  e:
    | React.MouseEvent<HTMLCanvasElement, MouseEvent>
    | React.WheelEvent<HTMLCanvasElement>,
): Point | null {
  if (!ctx.ui) {
    return null
  }

  const rect = ctx.ui.canvas.getBoundingClientRect()

  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  }
}
*/

export const Graph: React.FC<Props> = ({
  backgroundColor,
  width,
  height,
  groups,
  calls,
  tracer,
  getNodeStyle,
  getNodeText,
  nodeWidth = 100,
  nodeHeight = 50,
  nodeXGap = 50,
  nodeYGap = 50,
}) => {
  const arrowXPad = nodeXGap >> 1
  const arrowYPad = nodeYGap >> 1
  const layout = useMemo(() => {
    return screen.map(groups, calls, {
      width,
      height,
      center: {
        x: width >> 1,
        y: height >> 1,
      },
      node: {
        width: nodeWidth,
        height: nodeHeight,
        gap: {
          x: nodeXGap,
          y: nodeYGap,
        },
      },
    })
  }, [calls, width, height])

  const refs = useRef<Refs>({
    graph: null,
    ui: null,
    anim: null,
    mouse: null,
    zoomIndex: 9,
    view: {
      x: 0,
      y: 0,
      width,
      height,
    },
    drag: null,
    hover: null,
  })

  const ctx = useRef<Canvas>({ graph: null, ui: null })

  const [zoomIndex, setZoomIndex] = useState<number>(9)

  useEffect(() => {
    if (ctx.current) {
      ctx.current.graph = refs.current.graph?.getContext("2d") || null
      ctx.current.ui = refs.current.ui?.getContext("2d") || null
      animate()
    }

    return () => {
      if (refs.current.anim) {
        window.cancelAnimationFrame(refs.current.anim)
      }
    }
  }, [width, height])

  function animate() {
    refs.current.anim = window.requestAnimationFrame(animate)
    // @ts-ignore
    if (refs.current && width > 0 && height > 0) {
      // @ts-ignore
      draw(ctx.current, {
        width,
        height,
        layout,
        getNodeStyle: (node) => getNodeStyle(refs.current.hover, node),
        getNodeText: (node) => getNodeText(refs.current.hover, node),
        arrowXPad,
        arrowYPad,
        mouse: refs.current.mouse,
        scale: ZOOMS[refs.current.zoomIndex],
        offsetX: refs.current.view.x,
        offsetY: refs.current.view.y,
      })
    }
  }

  const getMouse = (
    ref: HTMLCanvasElement | null,
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
  ): Point | null => {
    if (!ref) {
      return null
    }
    const rect = ref.getBoundingClientRect()

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const zoom = (next: number) => {
    if (next == zoomIndex || !refs.current) {
      return
    }
    // TODO: center around mouse if not zoom from zoom controller

    // Zoom in -> view box decrease width and height
    // Zoom out -> view box increase width and height
    const up = next > zoomIndex
    const nextZoomIndex = up
      ? Math.min(next, MAX_ZOOM_INDEX)
      : Math.max(next, MIN_ZOOM_INDEX)
    const w = Math.floor(width / ZOOMS[nextZoomIndex])
    const h = Math.floor(height / ZOOMS[nextZoomIndex])
    const center = {
      x: refs.current.view.x + (refs.current.view.width >> 1),
      y: refs.current.view.y + (refs.current.view.height >> 1),
    }

    setZoomIndex(nextZoomIndex)

    refs.current.zoomIndex = nextZoomIndex
    refs.current.view = {
      x: center.x - (w >> 1),
      y: center.y - (h >> 1),
      width: w,
      height: h,
    }
  }

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    e.preventDefault()

    if (!refs.current) {
      return
    }

    const mouse = getMouse(refs.current?.ui, e)
    if (mouse) {
      refs.current.drag = {
        startMouseX: mouse.x,
        startMouseY: mouse.y,
        startViewX: refs.current.view.x,
        startViewY: refs.current.view.y,
      }
    }
  }

  const onMouseUp = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    e.preventDefault()
    if (refs.current) {
      refs.current.drag = null
    }
  }

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    e.preventDefault()

    const mouse = getMouse(refs.current?.ui, e)
    if (mouse && refs.current) {
      refs.current.mouse = mouse

      if (refs.current.drag) {
        const dx = mouse.x - refs.current.drag.startMouseX
        const dy = mouse.y - refs.current.drag.startMouseY
        refs.current.view = {
          ...refs.current.view,
          x: refs.current.drag.startViewX + dx,
          y: refs.current.drag.startViewY + dy,
        }
      }

      const view = refs.current
        ? refs.current.view
        : {
            x: 0,
            y: 0,
            width,
            height,
          }

      const dragging = !!refs.current?.drag

      const hover: Hover = { node: null, arrows: null }
      if (!dragging && mouse) {
        for (const node of layout.nodes.values()) {
          if (screen.isInside(mouse, node.rect)) {
            // Assign to the last node that the mouse is hovering - don't break from for loop
            hover.node = node.id
          }
        }

        if (hover.node == null) {
          hover.arrows = new Set()

          for (let i = 0; i < layout.arrows.length; i++) {
            const a = layout.arrows[i]
            let yPad = -arrowYPad
            if (getArrowType(a.p0, a.p1) == "callback") {
              const g = layout.rev.get(a.e)
              if (g != undefined) {
                const group = layout.nodes.get(g)
                if (group) {
                  yPad -= a.p1.y - group.rect.y
                }
              }
            }
            const b = box(
              poly(a.p0, a.p1, arrowXPad, yPad),
              BOX_X_PADD,
              BOX_Y_PADD,
            )
            if (screen.isInside(mouse, b)) {
              const points = sample(a, arrowXPad, yPad)
              for (let i = 0; i < points.length; i++) {
                if (math.dist(points[i], mouse) < R) {
                  hover.arrows.add(a.i)
                }
              }
            }
          }
        }
      }

      // TODO: set hover - fix after drag and zoom
      console.log("HOVER", hover)
      refs.current.hover = hover
    }
  }

  const onMouseOut = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    e.preventDefault()
    if (refs.current) {
      refs.current.mouse = null
      refs.current.drag = null
      refs.current.hover = null
    }
  }

  const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!refs.current) {
      return
    }
    if (e.deltaY < 0) {
      // Zoom in
      zoom(zoomIndex + 1)
    } else {
      // Zoom out
      zoom(zoomIndex - 1)
    }
  }

  return (
    <div
      style={{
        position: "relative",
        cursor: "crosshair",
        width,
        height,
        backgroundColor,
      }}
    >
      <canvas
        ref={(ref) => {
          refs.current.graph = ref
        }}
        style={STYLE}
        width={width}
        height={height}
      ></canvas>
      <canvas
        ref={(ref) => {
          refs.current.ui = ref
        }}
        style={STYLE}
        width={width}
        height={height}
        onMouseMove={onMouseMove}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseOut={onMouseOut}
        onWheel={onWheel}
      ></canvas>
    </div>
  )
}
