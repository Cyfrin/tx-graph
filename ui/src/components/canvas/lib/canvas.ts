import { Point } from "./types"

const FONT = "sans-serif"
const FONT_SIZE = 18

// TODO: clean up

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

export function drawRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  {
    rx = 8,
    ry = 8,
    fill = "transparent",
    stroke = "black",
    strokeWidth = 2,
  }: {
    rx?: number
    ry?: number
    fill?: string
    stroke?: string
    strokeWidth?: number
  } = {},
) {
  ctx.save()

  ctx.lineWidth = strokeWidth
  ctx.strokeStyle = stroke
  ctx.fillStyle = fill

  ctx.beginPath()
  ctx.moveTo(x + rx, y)
  ctx.lineTo(x + width - rx, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + ry)
  ctx.lineTo(x + width, y + height - ry)
  ctx.quadraticCurveTo(x + width, y + height, x + width - rx, y + height)
  ctx.lineTo(x + rx, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - ry)
  ctx.lineTo(x, y + ry)
  ctx.quadraticCurveTo(x, y, x + rx, y)
  ctx.closePath()

  if (fill !== "transparent") ctx.fill()
  ctx.stroke()

  ctx.restore()
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
  ctx.save()

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

  ctx.restore()
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
