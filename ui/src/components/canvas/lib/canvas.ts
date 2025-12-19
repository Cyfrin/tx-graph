import { Canvas, Point, Layout, Node } from "./types"

const FONT = "sans-serif"
const FONT_SIZE = 18

const DEFAULT_FILL = "none"
const DEFAULT_STROKE = "black"

// TODO: clean up

export type Params = {
  width: number
  height: number
  layout: Layout
  getNodeStyle: (node: Node) => { fill?: string; stroke?: string }
}

export function draw(ctx: Canvas, params: Params) {
  const { width, height, layout, getNodeStyle } = params
  ctx.graph?.clearRect(0, 0, width, height)
  ctx.ui?.clearRect(0, 0, width, height)

  if (ctx.graph) {
    const nodes = layout.nodes.values()
    for (const node of nodes) {
      const style = getNodeStyle(node)
      // TODO: get node style
      drawRect(ctx.graph, {
        x: node.rect.x,
        y: node.rect.y,
        width: node.rect.width,
        height: node.rect.height,
        fill: style?.fill || DEFAULT_FILL,
        stroke: style?.stroke || DEFAULT_STROKE,
      })
    }

    for (const arrow of layout.arrows) {
      if (arrow.p0.y == arrow.p1.y) {
        // Straight arrow
        drawArrow(ctx.graph, {
          x0: arrow.p0.x,
          y0: arrow.p0.y,
          x1: arrow.p1.x,
          y1: arrow.p1.y,
        })
      } else if (arrow.p1.x <= arrow.p0.x) {
        // Callback arrow
        // TODO:
        const arrowXPadd = 0
        /*
      const g = layout.rev.get(a.e)
      let yPadd = -arrowYPadd
      if (g != undefined) {
        const group = layout.nodes.get(g)
        if (group) {
          yPadd -= a.p1.y - group.rect.y
        }
      }
      */
        drawCallBackArrow(ctx.graph, {
          x0: arrow.p0.x,
          y0: arrow.p0.y,
          x1: arrow.p1.x,
          y1: arrow.p1.y,
          xPadd: arrowXPadd,
          yPadd: 0,
        })
      } else {
        // zig-zag arrow
        drawZigZagArrow(ctx.graph, {
          x0: arrow.p0.x,
          y0: arrow.p0.y,
          x1: arrow.p1.x,
          y1: arrow.p1.y,
        })
      }
    }
  }
  if (ctx.ui) {
    //
  }
}

export function drawRect(
  ctx: CanvasRenderingContext2D,
  params: {
    x: number
    y: number
    width: number
    height: number
    borderRadius?: number
    fill?: string
    stroke?: string
    strokeWidth?: number
  },
) {
  const {
    x,
    y,
    width,
    height,
    borderRadius = 8,
    fill = "transparent",
    stroke = "black",
    strokeWidth = 2,
  } = params

  ctx.save()
  ctx.lineWidth = strokeWidth
  ctx.strokeStyle = stroke
  ctx.fillStyle = fill

  ctx.roundRect(x, y, width, height, borderRadius)

  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

export function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  params: {
    x0: number
    y0: number
    x1: number
    y1: number
    size?: number
  },
) {
  const { x0, y0, x1, y1, size = 10 } = params
  const angle = Math.atan2(y1 - y0, x1 - x0)

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(
    x1 - size * Math.cos(angle - Math.PI / 6),
    y1 - size * Math.sin(angle - Math.PI / 6),
  )
  ctx.lineTo(
    x1 - size * Math.cos(angle + Math.PI / 6),
    y1 - size * Math.sin(angle + Math.PI / 6),
  )
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  params: {
    x0: number
    y0: number
    x1: number
    y1: number
    stroke?: string
    strokeWidth?: number
    text?: string | number
    textXGap?: number
    textYGap?: number
  },
) {
  const {
    x0,
    y0,
    x1,
    y1,
    stroke = "black",
    strokeWidth = 2,
    text,
    textXGap = 0,
    textYGap = -10,
  } = params

  ctx.save()

  ctx.strokeStyle = stroke
  ctx.fillStyle = stroke
  ctx.lineWidth = strokeWidth

  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.stroke()

  drawArrowHead(ctx, { x0, y0, x1, y1 })

  if (text != null) {
    ctx.font = `${FONT_SIZE}px ${FONT}`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(String(text), ((x0 + x1) >> 1) + textXGap, y0 + textYGap)
  }

  ctx.restore()
}

export function drawZigZagArrow(
  ctx: CanvasRenderingContext2D,
  params: {
    x0: number
    y0: number
    x1: number
    y1: number
    stroke?: string
    strokeWidth?: number
    text?: string | number
    textXGap?: number
    textYGap?: number
  },
) {
  const {
    x0,
    y0,
    x1,
    y1,
    stroke = "black",
    strokeWidth = 2,
    text = null,
    textXGap = -14,
    textYGap = -14,
  } = params

  ctx.save()
  const midX = (x0 + x1) >> 1

  ctx.strokeStyle = stroke
  ctx.fillStyle = stroke
  ctx.lineWidth = strokeWidth

  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(midX, y0)
  ctx.lineTo(midX, y1)
  ctx.lineTo(x1, y1)
  ctx.stroke()

  drawArrowHead(ctx, { x0: midX, y0: y1, x1, y1 })

  if (text != null) {
    ctx.font = `${FONT_SIZE}px ${FONT}`
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"
    ctx.fillText(text.toString(), midX + textXGap, y1 + textYGap)
  }

  ctx.restore()
}

export function drawCallBackArrow(
  ctx: CanvasRenderingContext2D,
  params: {
    x0: number
    y0: number
    x1: number
    y1: number
    xPadd: number
    yPadd: number
    stroke?: string
    strokeWidth?: number
    text?: string | number
    textXGap?: number
    textYGap?: number
  },
) {
  const {
    x0,
    y0,
    x1,
    y1,
    xPadd,
    yPadd,
    stroke = "black",
    strokeWidth = 2,
    text,
    textXGap = 0,
    textYGap = -14,
  } = params

  ctx.save()

  ctx.strokeStyle = stroke
  ctx.fillStyle = stroke
  ctx.lineWidth = strokeWidth

  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x0 + xPadd, y0)
  ctx.lineTo(x0 + xPadd, y1 + yPadd)
  ctx.lineTo(x1, y1 + yPadd)
  ctx.lineTo(x1, y1)
  ctx.stroke()

  drawArrowHead(ctx, { x0: x1, y0: y1 + yPadd, x1: x1, y1 })

  if (text != null) {
    ctx.font = `${FONT_SIZE}px ${FONT}`
    ctx.textAlign = "left"
    ctx.textBaseline = "middle"
    ctx.fillText(text.toString(), x1 + textXGap, y1 + yPadd + textYGap)
  }

  ctx.restore()
}

export function drawDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fill: string = "red",
) {
  ctx.save()
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}
