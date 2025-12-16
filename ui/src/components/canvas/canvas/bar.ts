import { CanvasContext, Layout, Range, BarGraph } from "./types"
import { getCanvasX, getCanvasY } from "./math"

export function draw(
  ctx: CanvasContext,
  layout: Layout,
  range: Range,
  graph: Partial<BarGraph>,
) {
  const {
    graph: { top, left, width, height },
  } = layout
  const { xMin, xMax, yMin, yMax } = range

  const {
    data = [],
    step = 1,
    getBarColor = () => "",
    barWidth = 1,
    y0 = yMin,
  } = graph

  const canvasY0 = getCanvasY(height, top, yMax, yMin, y0)

  if (step > 0) {
    for (let i = 0; i < data.length; i += step) {
      const d = data[i]
      const { x, y } = d

      if (xMin <= x && x <= xMax) {
        const canvasX = getCanvasX(width, left, xMax, xMin, x)
        const canvasY = getCanvasY(height, top, yMax, yMin, y)

        const barHeight = canvasY0 - canvasY

        ctx.fillStyle = getBarColor(d)
        ctx.fillRect(canvasX - barWidth / 2, canvasY, barWidth, barHeight)
      }
    }
  }
}
