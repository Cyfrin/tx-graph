import React, { useState, useMemo, useRef, useEffect } from "react"
import { Canvas, Groups, Call, Point, Node, Arrow } from "./lib/types"
import * as screen from "./lib/screen"
import { draw } from "./lib/canvas"
import { Hover, Tracer } from "./types"

const STYLE: React.CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
}

const DEFAULT_NODE_FILL = "none"
const DEFAULT_NODE_STROKE = "black"

type Refs = {
  graph: HTMLCanvasElement | null
  ui: HTMLCanvasElement | null
  // animation frame
  anim: number | null
  // NOTE: store params and layout as ref for animate to draw with latest params
  mouse: Point | null
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
  })

  const ctx = useRef<Canvas>({ graph: null, ui: null })

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
        getNodeStyle: (node) => getNodeStyle(null, node),
        getNodeText: (node) => getNodeText(null, node),
        arrowXPad,
        arrowYPad,
        mouse: refs.current?.mouse,
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

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    e.preventDefault()
    const mouse = getMouse(refs.current?.ui, e)
    if (mouse && refs.current) {
      refs.current.mouse = mouse
      // setMouse(mouse)
      /*
      if (drag) {
        const dx = mouse.x - drag.startMouseX
        const dy = mouse.y - drag.startMouseY
        setViewBox({
          ...viewBox,
          x: drag.startViewBoxX - dx,
          y: drag.startViewBoxY - dy,
        })
      }
      */
    }
  }

  const onMouseOut = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    e.preventDefault()
    if (refs.current) {
      refs.current.mouse = null
    }
    // setDrag(null)
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
        onMouseOut={onMouseOut}
      ></canvas>
    </div>
  )
}
