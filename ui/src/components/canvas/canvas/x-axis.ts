import { CanvasContext, Layout, Range, XAxis } from "./types"
import { getCanvasX, stepBelow } from "./math"

const TICK_TEXT_PADDING = 10

function drawTick(
  ctx: CanvasContext,
  layout: Layout,
  range: Range,
  xAxis: XAxis,
  x: number,
) {
  const {
    xAxis: { top, left, width, height },
  } = layout
  const { xMin, xMax } = range

  const {
    xAxisAlign,
    xAxisFont,
    xAxisLineColor,
    xAxisTextColor,
    xTickLength,
    renderXTick,
  } = xAxis

  const canvasX = getCanvasX(width, left, xMax, xMin, x)

  ctx.font = xAxisFont
  ctx.fillStyle = xAxisTextColor
  ctx.strokeStyle = xAxisLineColor
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"

  if (xAxisAlign == "top") {
    ctx.beginPath()
    ctx.moveTo(canvasX, top + height)
    ctx.lineTo(canvasX, top + height - xTickLength)
    ctx.stroke()

    if (renderXTick) {
      ctx.fillText(
        renderXTick(x),
        canvasX,
        top + height - xTickLength - TICK_TEXT_PADDING,
      )
    }
  } else if (xAxisAlign == "bottom") {
    ctx.beginPath()
    ctx.moveTo(canvasX, top)
    ctx.lineTo(canvasX, top + xTickLength)
    ctx.stroke()

    if (renderXTick) {
      ctx.fillText(
        renderXTick(x),
        canvasX,
        top + xTickLength + TICK_TEXT_PADDING,
      )
    }
  }
}

function drawLine(
  ctx: CanvasContext,
  layout: Layout,
  range: Range,
  xAxis: XAxis,
  x: number,
) {
  const {
    graph: { left, top, width, height },
  } = layout
  const { xMin, xMax } = range
  const { xLineColor } = xAxis

  const canvasX = getCanvasX(width, left, xMax, xMin, x)

  ctx.strokeStyle = xLineColor

  ctx.beginPath()
  ctx.moveTo(canvasX, top)
  ctx.lineTo(canvasX, top + height)
  ctx.stroke()
}

export function draw(
  ctx: CanvasContext,
  layout: Layout,
  range: Range,
  xAxis: XAxis,
) {
  const {
    xAxis: { top, left, width, height },
  } = layout
  const { xMin, xMax } = range

  const { xAxisAlign, xAxisLineColor, xTicks, xTickInterval, showXLine } = xAxis

  // style x axis line
  ctx.lineWidth = 1
  ctx.strokeStyle = xAxisLineColor

  if (xAxisAlign == "top") {
    ctx.beginPath()
    ctx.moveTo(left, top + height)
    ctx.lineTo(left + width, top + height)
    ctx.stroke()
  } else if (xAxisAlign == "bottom") {
    ctx.beginPath()
    ctx.moveTo(left, top)
    ctx.lineTo(left + width, top)
    ctx.stroke()
  }

  if (xTickInterval > 0) {
    const x0 = stepBelow(xMin, xTickInterval)

    for (let x = x0; x <= xMax; x += xTickInterval) {
      if (xMin <= x && x <= xMax) {
        drawTick(ctx, layout, range, xAxis, x)

        if (showXLine) {
          drawLine(ctx, layout, range, xAxis, x)
        }
      }
    }
  }

  const len = xTicks.length
  for (let i = 0; i < len; i++) {
    const x = xTicks[i]
    if (xMin <= x && x <= xMax) {
      drawTick(ctx, layout, range, xAxis, x)

      if (showXLine) {
        drawLine(ctx, layout, range, xAxis, x)
      }
    }
  }
}
