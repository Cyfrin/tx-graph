import { CanvasContext, Layout, LineGraph, Range } from "./types"
import { getCanvasX, getCanvasY } from "./math"

export function draw(
  ctx: CanvasContext,
  layout: Layout,
  range: Range,
  graph: Partial<LineGraph>,
) {
  const {
    graph: { top, left, width, height },
  } = layout
  const { xMin, xMax, yMin, yMax } = range

  const { data = [], step = 0, lineColor = "", lineWidth = 1 } = graph

  ctx.strokeStyle = lineColor
  ctx.lineWidth = lineWidth

  if (step > 0) {
    ctx.beginPath()
    for (let i = 0; i < data.length; i += step) {
      const { x, y } = data[i]

      if (xMin <= x && x <= xMax) {
        ctx.lineTo(
          getCanvasX(width, left, xMax, xMin, x),
          getCanvasY(height, top, yMax, yMin, y),
        )
      }
    }
    ctx.stroke()
  }
}
