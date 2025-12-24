import { Canvas, Point, Layout, Node } from "./types"
import * as math from "./math"

const DEBUG = true
const FONT = "sans-serif"
const FONT_SIZE = 18

const DEFAULT_FILL = "none"
const DEFAULT_STROKE = "black"

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

// TODO: clean up
// TODO: clean up default params
// TODO: line flow animation

export type Params = {
  width: number
  height: number
  layout: Layout
  getNodeStyle: (node: Node) => { fill?: string; stroke?: string }
  getNodeText: (node: Node) => string
  arrowXPad: number
  arrowYPad: number
  mouse: Point | null
  scale: number
  offsetX: number
  offsetY: number
}

export function draw(ctx: Canvas, params: Params) {
  const {
    width,
    height,
    layout,
    getNodeStyle,
    getNodeText,
    arrowXPad,
    arrowYPad,
    mouse,
    scale,
    offsetX,
    offsetY,
  } = params
  ctx.graph?.clearRect(0, 0, width, height)
  ctx.ui?.clearRect(0, 0, width, height)

  if (ctx.graph) {
    ctx.graph.save()

    ctx.graph.translate(offsetX, offsetY)
    ctx.graph.scale(scale, scale)

    // TODO: Render arrows that are not hovered first
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
        const g = layout.rev.get(arrow.e)
        let yPad = -arrowYPad
        if (g != undefined) {
          const group = layout.nodes.get(g)
          if (group) {
            yPad -= arrow.p1.y - group.rect.y
          }
        }

        drawCallBackArrow(ctx.graph, {
          x0: arrow.p0.x,
          y0: arrow.p0.y,
          x1: arrow.p1.x,
          y1: arrow.p1.y,
          xPad: arrowXPad,
          yPad,
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

    const nodes = [...layout.nodes.values()]
    for (const node of nodes) {
      const style = getNodeStyle(node)
      drawRect(ctx.graph, {
        x: node.rect.x,
        y: node.rect.y,
        width: node.rect.width,
        height: node.rect.height,
        fill: style?.fill || DEFAULT_FILL,
        stroke: style?.stroke || DEFAULT_STROKE,
      })
    }

    for (const node of nodes) {
      const txt = getNodeText(node)
      if (txt) {
        drawText(ctx.graph, {
          x: node.rect.x,
          y: node.rect.y,
          width: node.rect.width,
          height: node.rect.height,
          text: txt,
        })
      }
    }

    ctx.graph.restore()
  }
  if (ctx.ui) {
    if (DEBUG && mouse) {
      const canvasX = getCanvasX(width, mouse.x, width, offsetX)
      const canvasY = getCanvasY(height, mouse.y, height, offsetY)

      /*
      console.log({
        x: mouse.x,
        y: mouse.y,
        canvasX,
        canvasY,
      })
      */

      drawDot(ctx.ui, {
        x: canvasX,
        y: canvasY,
        radius: 5,
        fill: "rgba(0, 255, 0, 0.5)",
      })
      drawDot(ctx.ui, {
        x: mouse.x,
        y: mouse.y,
        radius: 5,
        fill: "rgba(255, 0, 0, 0.5)",
      })
    }
  }
}

export function drawRect(
  ctx: CanvasRenderingContext2D,
  params: {
    x: number
    y: number
    width: number
    height: number
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
    fill = "transparent",
    stroke = "black",
    strokeWidth = 2,
  } = params

  ctx.save()
  ctx.lineWidth = strokeWidth
  ctx.strokeStyle = stroke
  ctx.fillStyle = fill

  ctx.rect(x, y, width, height)

  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  params: {
    x: number
    y: number
    width: number
    height: number
    xPad?: number
    yPad?: number
    text: string
    color?: string
    font?: string
  },
) {
  const {
    x,
    y,
    width,
    height,
    xPad = 14,
    yPad = 14,
    text,
    color = "white",
    font = "12px Arial",
  } = params

  ctx.save()
  // TODO: adjust text position based on function or contract
  ctx.textBaseline = "middle"
  ctx.textAlign = "left"

  ctx.font = font
  ctx.fillStyle = color

  let t = text
  const maxWidth = width - 2 * xPad
  if (ctx.measureText(text).width > maxWidth) {
    t = `${text.slice(0, 10)}...`
  }

  ctx.fillText(`${t}`, x + xPad, y + yPad)
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
    stroke = "white",
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
    stroke = "white",
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
    xPad: number
    yPad: number
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
    xPad,
    yPad,
    stroke = "white",
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
  ctx.lineTo(x0 + xPad, y0)
  ctx.lineTo(x0 + xPad, y1 + yPad)
  ctx.lineTo(x1, y1 + yPad)
  ctx.lineTo(x1, y1)
  ctx.stroke()

  drawArrowHead(ctx, { x0: x1, y0: y1 + yPad, x1: x1, y1 })

  if (text != null) {
    ctx.font = `${FONT_SIZE}px ${FONT}`
    ctx.textAlign = "left"
    ctx.textBaseline = "middle"
    ctx.fillText(text.toString(), x1 + textXGap, y1 + yPad + textYGap)
  }

  ctx.restore()
}

export function drawDot(
  ctx: CanvasRenderingContext2D,
  params: {
    x: number
    y: number
    radius: number
    fill?: string
  },
) {
  const { x, y, radius, fill = "red" } = params
  ctx.save()
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}
