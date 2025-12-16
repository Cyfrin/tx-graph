import { CanvasContext, Layout, Range, YAxis } from "./types"
import { getCanvasY, stepBelow } from "./math"

const TICK_TEXT_PADDING = 5

function drawTick(
  ctx: CanvasContext,
  layout: Layout,
  range: Range,
  yAxis: YAxis,
  y: number,
) {
  const {
    yAxis: { top, left, height, width },
  } = layout
  const { yMin, yMax } = range

  const {
    yAxisAlign,
    yAxisLineColor,
    yAxisFont,
    yAxisTextColor,
    yTickLength,
    renderYTick,
  } = yAxis

  const canvasY = getCanvasY(height, top, yMax, yMin, y)

  ctx.strokeStyle = yAxisLineColor
  ctx.font = yAxisFont
  ctx.fillStyle = yAxisTextColor
  ctx.textAlign = yAxisAlign == "left" ? "right" : "left"
  ctx.textBaseline = "middle"

  if (yAxisAlign == "left") {
    ctx.beginPath()
    ctx.moveTo(left + width, canvasY)
    ctx.lineTo(left + width - yTickLength, canvasY)
    ctx.stroke()

    if (renderYTick) {
      ctx.fillText(
        renderYTick(y),
        left + width - yTickLength - TICK_TEXT_PADDING,
        canvasY,
      )
    }
  } else if (yAxisAlign == "right") {
    ctx.beginPath()
    ctx.moveTo(left, canvasY)
    ctx.lineTo(left + yTickLength, canvasY)
    ctx.stroke()

    if (renderYTick) {
      ctx.fillText(
        renderYTick(y),
        left + yTickLength + TICK_TEXT_PADDING,
        canvasY,
      )
    }
  }
}

function drawLine(
  ctx: CanvasContext,
  layout: Layout,
  range: Range,
  yAxis: YAxis,
  y: number,
) {
  const {
    graph: { top, left, height, width },
  } = layout
  const { yMin, yMax } = range
  const { yLineColor } = yAxis

  const canvasY = getCanvasY(height, top, yMax, yMin, y)

  ctx.strokeStyle = yLineColor

  ctx.beginPath()
  ctx.moveTo(left, canvasY)
  ctx.lineTo(left + width, canvasY)
  ctx.stroke()
}

export function draw(
  ctx: CanvasContext,
  layout: Layout,
  range: Range,
  yAxis: YAxis,
) {
  const {
    yAxis: { top, left, height, width },
  } = layout
  const { yMin, yMax } = range

  const { showYLine, yAxisAlign, yAxisLineColor, yTicks, yTickInterval } = yAxis

  // style y axis line
  ctx.lineWidth = 1
  ctx.strokeStyle = yAxisLineColor

  if (yAxisAlign == "left") {
    ctx.beginPath()
    ctx.moveTo(left + width, top)
    ctx.lineTo(left + width, top + height)
    ctx.stroke()
  } else if (yAxisAlign == "right") {
    ctx.beginPath()
    ctx.moveTo(left, top)
    ctx.lineTo(left, top + height)
    ctx.stroke()
  }

  if (yTickInterval > 0) {
    const y0 = stepBelow(yMin, yTickInterval)

    for (let y = y0; y <= yMax; y += yTickInterval) {
      if (yMin <= y && y <= yMax) {
        drawTick(ctx, layout, range, yAxis, y)

        if (showYLine) {
          drawLine(ctx, layout, range, yAxis, y)
        }
      }
    }
  }

  const len = yTicks.length
  for (let i = 0; i < len; i++) {
    const y = yTicks[i]
    if (yMin <= y && y <= yMax) {
      drawTick(ctx, layout, range, yAxis, y)

      if (showYLine) {
        drawLine(ctx, layout, range, yAxis, y)
      }
    }
  }
}
