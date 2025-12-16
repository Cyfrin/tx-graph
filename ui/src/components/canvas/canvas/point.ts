import { CanvasContext, Layout, PointGraph, Range } from "./types"
import { getCanvasX, getCanvasY } from "./math"

export function draw(
  ctx: CanvasContext,
  layout: Layout,
  range: Range,
  graph: Partial<PointGraph>,
) {
  const {
    graph: { top, left, width, height },
  } = layout
  const { xMin, xMax, yMin, yMax } = range

  const {
    data = [],
    color = "",
    radius = 1,
    ambientColor = "",
    ambientRadius = 0,
  } = graph

  const len = data.length
  for (let i = 0; i < len; i++) {
    const { x, y } = data[i]

    if (xMin <= x && x <= xMax) {
      const canvasX = getCanvasX(width, left, xMax, xMin, x)
      const canvasY = getCanvasY(height, top, yMax, yMin, y)

      if (ambientRadius > 0) {
        ctx.beginPath()
        ctx.arc(canvasX, canvasY, ambientRadius, 0, 2 * Math.PI, false)
        ctx.fillStyle = ambientColor
        ctx.fill()
      }

      if (radius > 0) {
        ctx.beginPath()
        ctx.arc(canvasX, canvasY, radius, 0, 2 * Math.PI, false)
        ctx.fillStyle = color
        ctx.fill()
      }
    }
  }
}
