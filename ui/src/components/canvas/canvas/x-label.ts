import { CanvasContext, Layout, Range, Box, XAxisAlign, XLabel } from "./types"
import { getCanvasX } from "./math"

function getTop(
  graph: Box,
  labelHeight: number,
  xAxis: { xAxisAlign: XAxisAlign; xTickLength: number },
): number {
  const { xAxisAlign, xTickLength } = xAxis

  if (xAxisAlign == "top") {
    return graph.top - labelHeight - xTickLength
  }
  if (xAxisAlign == "bottom") {
    return graph.top + graph.height + xTickLength
  }

  return 0
}

function getLineStart(
  graph: Box,
  xAxis: { xAxisAlign: XAxisAlign; xTickLength: number },
): number {
  const { xAxisAlign, xTickLength } = xAxis

  if (xAxisAlign == "top") {
    return graph.top - xTickLength
  }
  if (xAxisAlign == "bottom") {
    return graph.top + graph.height + xTickLength
  }

  return 0
}

function getLineEnd(graph: Box, xAxis: { xAxisAlign: XAxisAlign }): number {
  const { xAxisAlign } = xAxis

  if (xAxisAlign == "top") {
    return graph.top + graph.height
  }
  if (xAxisAlign == "bottom") {
    return graph.top
  }

  return 0
}

export function draw(
  ctx: CanvasContext,
  layout: Layout,
  range: Range,
  label: Partial<XLabel>,
  xAxis: {
    xAxisAlign: XAxisAlign
    xTickLength: number
  },
) {
  const { graph } = layout
  const { xMin, xMax } = range
  const {
    getX,
    width = 50,
    height = 20,
    bgColor = "white",
    font = "",
    color = "black",
    textPadding = 10,
    render,
    drawLine = true,
    lineWidth = 1,
    lineColor = "black",
  } = label

  if (!getX) {
    return
  }

  const x = getX(layout, range)

  if (x != null && xMin <= x && x <= xMax) {
    const canvasX = getCanvasX(graph.width, graph.left, xMax, xMin, x)
    const left = canvasX - Math.round(width / 2)
    const top = getTop(graph, height, xAxis)

    // label box
    ctx.fillStyle = bgColor
    ctx.fillRect(left, top, width, height)

    // text
    ctx.font = font
    ctx.fillStyle = color
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    if (render) {
      ctx.fillText(render(x), left + width / 2, top + textPadding)
    }

    if (drawLine) {
      ctx.lineWidth = lineWidth
      ctx.strokeStyle = lineColor

      const lineStart = getLineStart(graph, xAxis)
      const lineEnd = getLineEnd(graph, xAxis)

      ctx.beginPath()
      ctx.moveTo(left + width / 2, lineStart)
      ctx.lineTo(left + width / 2, lineEnd)
      ctx.stroke()
    }
  }
}
