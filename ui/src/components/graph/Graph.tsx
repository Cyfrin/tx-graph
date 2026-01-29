import React, { useState, useMemo, useRef, useEffect } from "react"
import * as Types from "./lib/types"
import * as screen from "./lib/screen"
import * as math from "./lib/math"
import { draw } from "./lib/canvas"

const STYLE: React.CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  touchAction: "none",
}

const ZOOMS: number[] = [
  0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6,
  1.7, 1.8, 1.9, 2.0,
]
const MIN_ZOOM_INDEX = 0
const MAX_ZOOM_INDEX = ZOOMS.length - 1

const STEP = 50
const MIN_STEPS = 4
// Radius around pointer
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
  pointer: Types.Point | null
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
    pointer: Types.Point | null,
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
    pointer: null,
    hover: null,
  })

  const ctx = useRef<Types.Canvas>({ graph: null, ui: null })

  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null)
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
        pointer: refs.current.pointer,
        scale: ZOOMS[refs.current.zoomIndex],
        offsetX: refs.current.view.left,
        offsetY: refs.current.view.top,
      })
    }
  }

  const getPointer = (
    ref: HTMLCanvasElement | null,
    e:
      | React.PointerEvent<HTMLCanvasElement>
      | React.WheelEvent<HTMLCanvasElement>,
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

  const zoom = (next: number, pointer: Types.Point | null) => {
    if (next == zoomIndex || !refs.current) {
      return
    }
    const up = next > zoomIndex
    const nextZoomIndex = up
      ? Math.min(next, MAX_ZOOM_INDEX)
      : Math.max(next, MIN_ZOOM_INDEX)

    const oldScale = ZOOMS[zoomIndex]
    const newScale = ZOOMS[nextZoomIndex]

    // Adjust offset to zoom around pointer position
    if (pointer) {
      const canvasX = (pointer.x - refs.current.view.left) / oldScale
      const canvasY = (pointer.y - refs.current.view.top) / oldScale
      refs.current.view.left = pointer.x - canvasX * newScale
      refs.current.view.top = pointer.y - canvasY * newScale
    }

    setZoomIndex(nextZoomIndex)
    refs.current.zoomIndex = nextZoomIndex
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()

    if (!refs.current) {
      return
    }

    const point = getPointer(refs.current?.ui, e)
    if (point) {
      refs.current.drag = {
        startMouseX: point.x,
        startMouseY: point.y,
        startViewX: refs.current.view.left,
        startViewY: refs.current.view.top,
      }
    }
  }

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()

    if (refs.current) {
      refs.current.drag = null
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()

    if (disabled) {
      return
    }

    const pointer = getPointer(refs.current?.ui, e)
    if (pointer && refs.current) {
      refs.current.pointer = pointer
      setPointer(pointer)

      if (refs.current.drag) {
        const dx = pointer.x - refs.current.drag.startMouseX
        const dy = pointer.y - refs.current.drag.startMouseY
        refs.current.view = {
          ...refs.current.view,
          left: refs.current.drag.startViewX + dx,
          top: refs.current.drag.startViewY + dy,
        }
      }

      const dragging = !!refs.current?.drag

      const hover: Types.Hover = { node: null, arrows: null }
      if (!dragging && pointer) {
        const view = refs.current
          ? refs.current.view
          : {
              left: 0,
              top: 0,
            }
        const scale = ZOOMS[refs.current.zoomIndex]
        // Canvas coordinates
        const xy = {
          x: (pointer.x - view.left) / scale,
          y: (pointer.y - view.top) / scale,
        }

        for (const node of layout.nodes.values()) {
          if (screen.isInside(xy, node.rect)) {
            // Assign to the last node that the pointer is hovering
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

  const onPointerLeave = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()

    if (refs.current) {
      refs.current.drag = null
      refs.current.pointer = null
      refs.current.hover = null
    }
    setPointer(null)
    setHover(null)
  }

  const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!refs.current) {
      return
    }
    const pointer = getPointer(refs.current.ui, e)
    if (e.deltaY < 0) {
      // Zoom in
      zoom(zoomIndex + 1, pointer)
    } else {
      // Zoom out
      zoom(zoomIndex - 1, pointer)
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
        touchAction: "none",
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
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        onPointerCancel={onPointerLeave}
        onWheel={onWheel}
      ></canvas>
      {hover && pointer && renderHover ? (
        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              top: pointer.y + 12,
              left: pointer.x + 12,
            }}
          >
            {renderHover(hover, pointer)}
          </div>
        </div>
      ) : null}
    </div>
  )
}
