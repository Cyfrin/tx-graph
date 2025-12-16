import {
  CanvasContext,
  Layout,
  Range,
  Box,
  YLabel,
  YAxisAlign,
  TextAlign,
} from "./types"
import { getCanvasY } from "./math"

function getLeft(
  graph: Box,
  labelWidth: number,
  yAxis: { yAxisAlign: YAxisAlign; yTickLength: number },
): number {
  const { yAxisAlign, yTickLength } = yAxis

  if (yAxisAlign == "left") {
    return graph.left - labelWidth - yTickLength
  }
  if (yAxisAlign == "right") {
    return graph.left + graph.width + yTickLength
  }

  return 0
}

function getTextAlign(yAxisAlign: YAxisAlign): TextAlign {
  switch (yAxisAlign) {
    case "left":
      return "right"
    case "right":
      return "left"
    default:
      console.error(`invalid yAxisAlign ${yAxisAlign}`)
      return "right"
  }
}

function getTextLeft(
  left: number,
  label: { textPadding: number; width: number },
  yAxisAlign: YAxisAlign,
): number {
  const { textPadding, width } = label

  switch (yAxisAlign) {
    case "left":
      return left + width - textPadding
    case "right":
      return left + textPadding
    default:
      console.error(`invalid yAxisAlign ${yAxisAlign}`)
      return left + width - textPadding
  }
}

function getLineStart(
  graph: Box,
  yAxis: { yAxisAlign: YAxisAlign; yTickLength: number },
): number {
  const { yAxisAlign, yTickLength } = yAxis

  if (yAxisAlign == "left") {
    return graph.left - yTickLength
  }
  if (yAxisAlign == "right") {
    return graph.left + graph.width + yTickLength
  }

  return 0
}

function getLineEnd(graph: Box, yAxis: { yAxisAlign: YAxisAlign }): number {
  const { yAxisAlign } = yAxis

  if (yAxisAlign == "left") {
    return graph.left + graph.width
  }
  if (yAxisAlign == "right") {
    return graph.left
  }

  return 0
}

export function draw(
  ctx: CanvasContext,
  layout: Layout,
  range: Range,
  label: Partial<YLabel>,
  yAxis: {
    yAxisAlign: YAxisAlign
    yTickLength: number
  },
) {
  const { graph } = layout
  const { yMin, yMax } = range
  const {
    getY,
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

  if (!getY) {
    return
  }

  const y = getY(layout, range)

  if (y != null && yMin <= y && y <= yMax) {
    const canvasY = getCanvasY(graph.height, graph.top, yMax, yMin, y)
    const top = canvasY - Math.round(height / 2)
    const left = getLeft(graph, width, yAxis)

    ctx.fillStyle = bgColor

    // label box
    ctx.fillRect(left, top, width, height)

    // text
    ctx.font = font
    ctx.fillStyle = color
    ctx.textAlign = getTextAlign(yAxis.yAxisAlign)
    ctx.textBaseline = "middle"

    if (render) {
      ctx.fillText(
        render(y),
        getTextLeft(left, { textPadding, width }, yAxis.yAxisAlign),
        top + textPadding,
      )
    }

    if (drawLine) {
      ctx.lineWidth = lineWidth
      ctx.strokeStyle = lineColor

      const lineStart = getLineStart(graph, yAxis)
      const lineEnd = getLineEnd(graph, yAxis)

      ctx.beginPath()
      ctx.moveTo(lineStart, top + height / 2)
      ctx.lineTo(lineEnd, top + height / 2)
      ctx.stroke()
    }
  }
}
