import { Canvas, Point, Layout } from "./types"

const FONT = "sans-serif"
const FONT_SIZE = 18

const DEFAULT_FILL = "none"
const DEFAULT_STROKE = "black"

// TODO: clean up

export type Params = {
  width: number
  height: number
  layout: Layout
  style?: {
    nodeFill?: string
    nodeStroke?: string
  }
}

export function draw(ctx: Canvas, params: Params) {
  const { width, height, layout, style } = params
  ctx.graph?.clearRect(0, 0, width, height)
  ctx.ui?.clearRect(0, 0, width, height)

  if (ctx.graph) {
    const nodes = layout.nodes.values()
    for (const node of nodes) {
      // TODO: get node style
      drawRect(ctx.graph, {
        x: node.rect.x,
        y: node.rect.y,
        width: node.rect.width,
        height: node.rect.height,
        fill: style?.nodeFill || DEFAULT_FILL,
        stroke: style?.nodeStroke || DEFAULT_STROKE,
      })
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

  ctx.lineWidth = strokeWidth
  ctx.strokeStyle = stroke
  ctx.fillStyle = fill

  ctx.roundRect(x, y, width, height, borderRadius)

  ctx.fill()
  ctx.stroke()
}

export function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  size: number = 6,
) {
  const angle = Math.atan2(toY - fromY, toX - fromX)

  ctx.beginPath()
  ctx.moveTo(toX, toY)
  ctx.lineTo(
    toX - size * Math.cos(angle - Math.PI / 6),
    toY - size * Math.sin(angle - Math.PI / 6),
  )
  ctx.lineTo(
    toX - size * Math.cos(angle + Math.PI / 6),
    toY - size * Math.sin(angle + Math.PI / 6),
  )
  ctx.closePath()
  ctx.fill()
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  {
    stroke = "black",
    strokeWidth = 2,
    text,
    textXGap = 0,
    textYGap = -10,
  }: {
    stroke?: string
    strokeWidth?: number
    text?: string | number
    textXGap?: number
    textYGap?: number
  } = {},
) {
  ctx.strokeStyle = stroke
  ctx.fillStyle = stroke
  ctx.lineWidth = strokeWidth

  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.stroke()

  drawArrowHead(ctx, x0, y0, x1, y1)

  if (text != null) {
    ctx.font = `${FONT_SIZE}px ${FONT}`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(String(text), ((x0 + x1) >> 1) + textXGap, y0 + textYGap)
  }
}

export function drawZigZagArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  {
    stroke = "black",
    strokeWidth = 2,
    text,
    textXGap = -14,
    textYGap = -14,
  }: {
    stroke?: string
    strokeWidth?: number
    text?: string | number
    textXGap?: number
    textYGap?: number
  } = {},
) {
  const midX = (x0 + x1) >> 1

  ctx.save()

  ctx.strokeStyle = stroke
  ctx.fillStyle = stroke
  ctx.lineWidth = strokeWidth

  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(midX, y0)
  ctx.lineTo(midX, y1)
  ctx.lineTo(x1, y1)
  ctx.stroke()

  drawArrowHead(ctx, midX, y1, x1, y1)

  if (text != null) {
    ctx.font = `${FONT_SIZE}px ${FONT}`
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"
    ctx.fillText(String(text), midX + textXGap, y1 + textYGap)
  }

  ctx.restore()
}

export function drawCallBackArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  xPadd: number,
  yPadd: number,
  {
    stroke = "black",
    strokeWidth = 2,
    text,
    textXGap = 0,
    textYGap = -14,
  }: {
    stroke?: string
    strokeWidth?: number
    text?: string | number
    textXGap?: number
    textYGap?: number
  } = {},
) {
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

  drawArrowHead(ctx, x1, y1 + yPadd, x1, y1)

  if (text != null) {
    ctx.font = `${FONT_SIZE}px ${FONT}`
    ctx.textAlign = "left"
    ctx.textBaseline = "middle"
    ctx.fillText(String(text), x1 + textXGap, y1 + yPadd + textYGap)
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
