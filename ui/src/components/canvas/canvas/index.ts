import {
  CanvasContext,
  Context,
  XAxis,
  YAxis,
  Layout,
  Range,
  Crosshair,
  Text,
  XLabel,
  YLabel,
  Graph as GraphType,
} from "./types"

import * as xAxis from "./x-axis"
import * as yAxis from "./y-axis"
import * as bar from "./bar"
import * as line from "./line"
import * as point from "./point"
import * as crosshair from "./crosshair"
import * as text from "./text"
import * as xLabel from "./x-label"
import * as yLabel from "./y-label"

export type Params = {
  width: number
  height: number
  padding: number
  bgColor: string
  animate?: boolean
  range: Range
  // x axis
  xAxis: XAxis
  yAxis: YAxis
  // graphs
  graphs: GraphType[]
  texts: Partial<Text>[]
  xLabels: Partial<XLabel>[]
  yLabels: Partial<YLabel>[]
  crosshair?: Partial<Crosshair>
}

function _drawGraph(
  ctx: CanvasContext,
  layout: Layout,
  range: Range,
  graph: GraphType,
) {
  switch (graph.type) {
    case "bar":
      bar.draw(ctx, layout, range, graph)
      return
    case "line":
      line.draw(ctx, layout, range, graph)
      return
    case "point":
      point.draw(ctx, layout, range, graph)
      return
    default:
      return
  }
}

export function draw(ctx: Context, layout: Layout, params: Params) {
  const { width, height, range } = params

  ctx.axes?.clearRect(0, 0, width, height)
  ctx.graph?.clearRect(0, 0, width, height)
  ctx.ui?.clearRect(0, 0, width, height)

  if (ctx.axes) {
    xAxis.draw(ctx.axes, layout, range, params.xAxis)
    yAxis.draw(ctx.axes, layout, range, params.yAxis)
  }

  if (ctx.graph) {
    const len = params.graphs.length
    for (let i = 0; i < len; i++) {
      _drawGraph(ctx.graph, layout, range, params.graphs[i])
    }
  }

  if (ctx.ui) {
    if (params.crosshair) {
      crosshair.draw(ctx.ui, layout, params.crosshair)
    }

    // cache array length
    let len = 0

    const { texts } = params
    len = texts.length
    for (let i = 0; i < len; i++) {
      text.draw(ctx.ui, texts[i])
    }

    const { xLabels } = params
    len = xLabels.length
    for (let i = 0; i < len; i++) {
      xLabel.draw(ctx.ui, layout, range, xLabels[i], params.xAxis)
    }

    const { yLabels } = params
    len = yLabels.length
    for (let i = 0; i < len; i++) {
      yLabel.draw(ctx.ui, layout, range, yLabels[i], params.yAxis)
    }
  }
}
