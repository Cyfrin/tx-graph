import React, { useRef, useEffect } from "react"

const STYLE: React.CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
}

export type Context = {
  graph: CanvasRenderingContext2D | null | undefined
  ui: CanvasRenderingContext2D | null | undefined
}

type Refs = {
  graph: HTMLCanvasElement | null
  ui: HTMLCanvasElement | null
  // animation frame
  animation: number | null
  // NOTE: store params and layout as ref for animate to draw with latest params
  // params: GraphParams
  // layout: Layout
}

export type Props = {
  width: number
  height: number
  backgroundColor: string
  animate?: boolean
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
  ctx: Context,
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

const Graph: React.FC<Partial<Props>> = (props) => {
  const { backgroundColor, width, height } = props

  const refs = useRef<Refs>({
    graph: null,
    ui: null,
    animation: null,
  })

  const ctx = useRef<Context>({ graph: null, ui: null })

  useEffect(() => {
    ctx.current.graph = refs.current.graph?.getContext("2d")
    ctx.current.ui = refs.current.ui?.getContext("2d")

    if (ctx.current) {
      animate()
    }

    return () => {
      if (refs.current.animation) {
        window.cancelAnimationFrame(refs.current.animation)
      }
    }
  }, [width, height])

  function animate() {
    refs.current.animation = window.requestAnimationFrame(animate)
    if (refs.current) {
      // draw(ctx.current, refs.current.layout, refs.current.params)
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
      ></canvas>
    </div>
  )
}

export default Graph
