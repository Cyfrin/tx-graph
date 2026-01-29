import { Canvas, Point, Layout, Node, Arrow } from "./types"

const DEBUG = true
const FONT = "system-ui"
const FONT_SIZE = 18
const FILL = "translate"
const STROKE = "black"
const TEXT_COLOR = "white"

function isRectVisible(
  rect: { x: number; y: number; width: number; height: number },
  view: { minX: number; maxX: number; minY: number; maxY: number },
): boolean {
  return !(
    rect.x + rect.width < view.minX ||
    rect.x > view.maxX ||
    rect.y + rect.height < view.minY ||
    rect.y > view.maxY
  )
}

function isArrowVisible(
  arrow: Arrow,
  view: { minX: number; maxX: number; minY: number; maxY: number },
): boolean {
  const minX = Math.min(arrow.p0.x, arrow.p1.x)
  const maxX = Math.max(arrow.p0.x, arrow.p1.x)
  const minY = Math.min(arrow.p0.y, arrow.p1.y)
  const maxY = Math.max(arrow.p0.y, arrow.p1.y)

  return !(
    maxX < view.minX ||
    minX > view.maxX ||
    maxY < view.minY ||
    minY > view.maxY
  )
}

export type Params = {
  width: number
  height: number
  layout: Layout
  getNodeStyle: (node: Node) => { fill?: string; stroke?: string }
  getNodeText: (node: Node) => { txt: string; top: boolean }
  getArrowStyle: (arrow: Arrow) => { top: boolean; style: { stroke?: string } }
  arrowXPad: number
  arrowYPad: number
  // window coordinates
  pointer: Point | null
  scale: number
  // window coordinates
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
    getArrowStyle,
    arrowXPad,
    arrowYPad,
    pointer,
    scale,
    offsetX,
    offsetY,
  } = params
  ctx.graph?.clearRect(0, 0, width, height)
  ctx.ui?.clearRect(0, 0, width, height)

  if (ctx.graph) {
    ctx.graph.save()

    // Object at (x, y) -> drawn at (x + offsetX, y + offsetY)
    ctx.graph.translate(offsetX, offsetY)
    ctx.graph.scale(scale, scale)

    // Calculate viewport bounds in graph coordinates
    const view = {
      minX: -offsetX / scale,
      maxX: (-offsetX + width) / scale,
      minY: -offsetY / scale,
      maxY: (-offsetY + height) / scale,
    }

    const hovers = []
    for (const arrow of layout.arrows) {
      if (!isArrowVisible(arrow, view)) {
        continue
      }

      const { top, style } = getArrowStyle(arrow)
      if (top) {
        hovers.push(arrow)
      } else {
        drawArrow(ctx.graph, {
          layout,
          arrow,
          style,
          arrowXPad,
          arrowYPad,
        })
      }
    }

    const nodes = [...layout.nodes.values()].filter((node) =>
      isRectVisible(node.rect, view),
    )

    for (const node of nodes) {
      const style = getNodeStyle(node)
      drawRect(ctx.graph, {
        x: node.rect.x,
        y: node.rect.y,
        width: node.rect.width,
        height: node.rect.height,
        fill: style?.fill || FILL,
        stroke: style?.stroke || STROKE,
      })
    }

    for (const node of nodes) {
      const { txt, top } = getNodeText(node)
      if (txt) {
        drawText(ctx.graph, {
          x: node.rect.x,
          y: node.rect.y,
          width: node.rect.width,
          height: node.rect.height,
          text: txt,
          top,
        })
      }
    }

    for (const arrow of hovers) {
      const { style } = getArrowStyle(arrow)
      drawArrow(ctx.graph, {
        layout,
        arrow,
        style,
        arrowXPad,
        arrowYPad,
      })
    }

    /*
    if (DEBUG) {
      drawRect(ctx.graph, {
        ...layout.rect,
        stroke: "red",
        fill: "transparent",
      })
    }
    */

    ctx.graph.restore()
  }

  if (ctx.ui) {
    if (DEBUG && pointer) {
      drawDot(ctx.ui, {
        x: pointer.x,
        y: pointer.y,
        radius: 5,
        fill: "rgba(0, 255, 0, 0.5)",
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
    fill = FILL,
    stroke = STROKE,
    strokeWidth = 2,
  } = params

  ctx.lineWidth = strokeWidth
  ctx.strokeStyle = stroke
  ctx.fillStyle = fill

  ctx.beginPath()
  ctx.rect(x, y, width, height)
  ctx.fill()
  ctx.stroke()
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
    top?: boolean
  },
) {
  const {
    x,
    y,
    width,
    height,
    xPad = 14,
    yPad = 20,
    text,
    color = TEXT_COLOR,
    font = `${FONT_SIZE}px ${FONT}`,
    top = false,
  } = params

  ctx.textBaseline = "middle"
  ctx.textAlign = "left"
  ctx.font = font
  ctx.fillStyle = color

  let t = text
  const maxWidth = width - 2 * xPad
  const textWidth = ctx.measureText(text).width
  if (textWidth > maxWidth) {
    const len = Math.max(
      // - 3 for extra space on the right
      Math.floor((text.length / textWidth) * maxWidth) - 3,
      // Arbitrary cap
      14,
    )
    t = `${text.slice(0, len)}...`
  }

  ctx.fillText(`${t}`, x + xPad, y + (top ? yPad : height >> 1))
}

export function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  params: {
    x0: number
    y0: number
    x1: number
    y1: number
    size?: number
    stroke?: string
  },
) {
  const { x0, y0, x1, y1, size = 10, stroke = STROKE } = params
  const angle = Math.atan2(y1 - y0, x1 - x0)

  ctx.strokeStyle = stroke
  ctx.fillStyle = stroke

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
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  params: {
    layout: Layout
    arrow: Arrow
    style: { stroke?: string }
    arrowXPad: number
    arrowYPad: number
  },
) {
  const { layout, arrow, style, arrowXPad, arrowYPad } = params

  if (arrow.p0.y == arrow.p1.y) {
    // Straight arrow
    drawStraightArrow(ctx, {
      x0: arrow.p0.x,
      y0: arrow.p0.y,
      x1: arrow.p1.x,
      y1: arrow.p1.y,
      stroke: style.stroke,
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

    drawCallBackArrow(ctx, {
      x0: arrow.p0.x,
      y0: arrow.p0.y,
      x1: arrow.p1.x,
      y1: arrow.p1.y,
      xPad: arrowXPad,
      yPad,
      stroke: style.stroke,
    })
  } else {
    // zig-zag arrow
    drawZigZagArrow(ctx, {
      x0: arrow.p0.x,
      y0: arrow.p0.y,
      x1: arrow.p1.x,
      y1: arrow.p1.y,
      stroke: style.stroke,
    })
  }
}

export function drawStraightArrow(
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
    stroke = STROKE,
    strokeWidth = 2,
    text,
    textXGap = 0,
    textYGap = -10,
  } = params

  ctx.strokeStyle = stroke
  ctx.fillStyle = stroke
  ctx.lineWidth = strokeWidth

  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.stroke()

  drawArrowHead(ctx, { x0, y0, x1, y1, stroke })

  if (text != null) {
    ctx.font = `${FONT_SIZE}px ${FONT}`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(String(text), ((x0 + x1) >> 1) + textXGap, y0 + textYGap)
  }
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
    stroke = STROKE,
    strokeWidth = 2,
    text = null,
    textXGap = -14,
    textYGap = -14,
  } = params

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

  drawArrowHead(ctx, { x0: midX, y0: y1, x1, y1, stroke })

  if (text != null) {
    ctx.font = `${FONT_SIZE}px ${FONT}`
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"
    ctx.fillText(text.toString(), midX + textXGap, y1 + textYGap)
  }
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
    stroke = STROKE,
    strokeWidth = 2,
    text,
    textXGap = 0,
    textYGap = -14,
  } = params

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

  drawArrowHead(ctx, { x0: x1, y0: y1 + yPad, x1: x1, y1, stroke })

  if (text != null) {
    ctx.font = `${FONT_SIZE}px ${FONT}`
    ctx.textAlign = "left"
    ctx.textBaseline = "middle"
    ctx.fillText(text.toString(), x1 + textXGap, y1 + yPad + textYGap)
  }
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
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
}
