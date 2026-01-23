import React, { useState, useMemo, useRef, useEffect } from "react"
import * as Types from "./lib/types"
import * as screen from "./lib/screen"
import * as math from "./lib/math"
import { draw } from "./lib/canvas"

const STYLE: React.CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
}

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

export function getArrowType(
  p0: Types.Point,
  p1: Types.Point,
): Types.ArrowType {
  if (p0.y == p1.y) {
    return "arrow"
  }
  if (p1.x <= p0.x) {
    return "callback"
  }
  return "zigzag"
}

function poly(
  p0: Types.Point,
  p1: Types.Point,
  xPad: number = 0,
  yPad: number = 0,
): Types.Point[] {
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

function sample(
  a: Types.Arrow,
  xPad: number = 0,
  yPad: number = 0,
): Types.Point[] {
  const ps = poly(a.p0, a.p1, xPad, yPad)
  const [len] = math.len(ps)

  const n = Math.max(len > STEP ? (len / STEP) | 0 : MIN_STEPS, MIN_STEPS)

  return math.sample(n, (i) => {
    const t = i / n
    return math.perp(ps, t)
  })
}

type Refs = {
  graph: HTMLCanvasElement | null
  ui: HTMLCanvasElement | null
  // animation frame
  anim: number | null
  // NOTE: store params as ref for animate to draw with latest params
  zoomIndex: number
  view: {
    left: number
    top: number
  }
  drag: {
    startMouseX: number
    startMouseY: number
    startViewX: number
    startViewY: number
  } | null
  mouse: Types.Point | null
  hover: Types.Hover | null
}

export type Props<A, F> = {
  // UI should be disabled
  disabled: boolean
  width: number
  height: number
  backgroundColor: string
  groups: Types.Groups
  calls: Types.Call<A, F>[]
  tracer: Types.Tracer
  getNodeStyle: (
    hover: Types.Hover | null,
    node: Types.Node,
  ) => { fill?: string; stroke?: string }
  getNodeText: (
    hover: Types.Hover | null,
    node: Types.Node,
  ) => { txt: string; top: boolean }
  getArrowStyle: (
    hover: Types.Hover | null,
    arrow: Types.Arrow,
  ) => { top: boolean; style: { stroke?: string } }
  nodeWidth?: number
  nodeHeight?: number
  nodeXGap?: number
  nodeYGap?: number
  renderHover?: (
    hover: Types.Hover,
    mouse: Types.Point | null,
  ) => React.ReactNode
}

export const Graph = <A, F>({
  disabled,
  backgroundColor,
  width,
  height,
  groups,
  calls,
  tracer,
  getNodeStyle,
  getNodeText,
  getArrowStyle,
  nodeWidth = 200,
  nodeHeight = 40,
  nodeXGap = 50,
  nodeYGap = 50,
  renderHover,
}: Props<A, F>) => {
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

  // Some states and refs are duplicated to render React components and HTML canvas objects
  const refs = useRef<Refs>({
    graph: null,
    ui: null,
    anim: null,
    zoomIndex: 9,
    view: {
      left: 0,
      top: 0,
    },
    drag: null,
    mouse: null,
    hover: null,
  })

  const ctx = useRef<Types.Canvas>({ graph: null, ui: null })

  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null)
  const [hover, setHover] = useState<Types.Hover | null>(null)
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
  }, [calls, tracer, width, height])

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
        getArrowStyle: (arrow) => getArrowStyle(refs.current.hover, arrow),
        arrowXPad,
        arrowYPad,
        mouse: refs.current.mouse,
        scale: ZOOMS[refs.current.zoomIndex],
        offsetX: refs.current.view.left,
        offsetY: refs.current.view.top,
      })
    }
  }

  const getMouse = (
    ref: HTMLCanvasElement | null,
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
  ): Types.Point | null => {
    if (!ref) {
      return null
    }
    const rect = ref.getBoundingClientRect()

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const zoom = (next: number, mouse: Types.Point | null) => {
    if (next == zoomIndex || !refs.current) {
      return
    }
    const up = next > zoomIndex
    const nextZoomIndex = up
      ? Math.min(next, MAX_ZOOM_INDEX)
      : Math.max(next, MIN_ZOOM_INDEX)

    const oldScale = ZOOMS[zoomIndex]
    const newScale = ZOOMS[nextZoomIndex]

    // Adjust offset to zoom around mouse position
    if (mouse) {
      const canvasX = (mouse.x - refs.current.view.left) / oldScale
      const canvasY = (mouse.y - refs.current.view.top) / oldScale
      refs.current.view.left = mouse.x - canvasX * newScale
      refs.current.view.top = mouse.y - canvasY * newScale
    }

    setZoomIndex(nextZoomIndex)
    refs.current.zoomIndex = nextZoomIndex
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
        startViewX: refs.current.view.left,
        startViewY: refs.current.view.top,
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

    if (disabled) {
      return
    }

    const mouse = getMouse(refs.current?.ui, e)
    if (mouse && refs.current) {
      refs.current.mouse = mouse
      setMouse(mouse)

      if (refs.current.drag) {
        const dx = mouse.x - refs.current.drag.startMouseX
        const dy = mouse.y - refs.current.drag.startMouseY
        refs.current.view = {
          ...refs.current.view,
          left: refs.current.drag.startViewX + dx,
          top: refs.current.drag.startViewY + dy,
        }
      }

      const dragging = !!refs.current?.drag

      const hover: Types.Hover = { node: null, arrows: null }
      if (!dragging && mouse) {
        const view = refs.current
          ? refs.current.view
          : {
              left: 0,
              top: 0,
            }
        const scale = ZOOMS[refs.current.zoomIndex]
        // Canvas coordinates
        const xy = {
          x: (mouse.x - view.left) / scale,
          y: (mouse.y - view.top) / scale,
        }

        for (const node of layout.nodes.values()) {
          if (screen.isInside(xy, node.rect)) {
            // Assign to the last node that the mouse is hovering
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
            const b = screen.box(
              poly(a.p0, a.p1, arrowXPad, yPad),
              BOX_X_PADD,
              BOX_Y_PADD,
            )
            if (screen.isInside(xy, b)) {
              // TODO: cache?
              const points = sample(a, arrowXPad, yPad)
              for (let i = 0; i < points.length; i++) {
                if (math.dist(points[i], xy) < R) {
                  hover.arrows.add(a.i)
                }
              }
            }
          }
        }
      }

      refs.current.hover = hover
      setHover(hover)
    }
  }

  const onMouseOut = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    e.preventDefault()
    if (refs.current) {
      refs.current.drag = null
      refs.current.mouse = null
      refs.current.hover = null
    }
    setMouse(null)
    setHover(null)
  }

  const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!refs.current) {
      return
    }
    const mouse = getMouse(refs.current.ui, e)
    if (e.deltaY < 0) {
      // Zoom in
      zoom(zoomIndex + 1, mouse)
    } else {
      // Zoom out
      zoom(zoomIndex - 1, mouse)
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
      {hover && mouse && renderHover ? (
        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              top: mouse.y + 12,
              left: mouse.x + 12,
            }}
          >
            {renderHover(hover, mouse)}
          </div>
        </div>
      ) : null}
    </div>
  )
}
