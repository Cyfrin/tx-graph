export type CanvasContext = CanvasRenderingContext2D

export type Context = {
  axes: CanvasRenderingContext2D | null | undefined
  graph: CanvasRenderingContext2D | null | undefined
  ui: CanvasRenderingContext2D | null | undefined
}

export type Point = {
  x: number
  y: number
}

export type Range = {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

export type XRange = {
  xMin: number
  xMax: number
}

export type Box = {
  top: number
  left: number
  height: number
  width: number
}

export type Layout = {
  graph: Box
  yAxis: Box
  xAxis: Box
}

export type XAxisAlign = "top" | "bottom"
export type YAxisAlign = "left" | "right"
export type TextAlign = "left" | "right"

export type XAxis = {
  xAxisAlign: XAxisAlign
  xAxisHeight: number
  xAxisLineColor: string
  xAxisFont: string
  xAxisTextColor: string
  showXLine: boolean
  xLineColor: string
  xTicks: number[]
  xTickInterval: number
  xTickLength: number
  renderXTick?: (x: number) => string
}

export type YAxis = {
  yAxisAlign: YAxisAlign
  yAxisWidth: number
  yAxisLineColor: string
  yAxisFont: string
  yAxisTextColor: string
  showYLine: boolean
  yLineColor: string
  yTicks: number[]
  yTickInterval: number
  yTickLength: number
  renderYTick?: (y: number) => string
}

export type Crosshair = {
  // canvas x, y
  point: Point | null
  showXLine: boolean
  xLineColor: string
  xLineWidth: number
  showYLine: boolean
  yLineColor: string
  yLineWidth: number
}

export type Text = {
  left: number
  top: number
  text: number | string
  color: string
  font: string
}

export type XLabel = {
  getX?: (layout: Layout, range: Range) => number | null
  width: number
  height: number
  bgColor: string
  color: string
  font: string
  textPadding: number
  render?: (x: number) => string
  drawLine: boolean
  lineWidth: number
  lineColor: string
}

export type YLabel = {
  getY?: (layout: Layout, range: Range) => number | null
  width: number
  height: number
  bgColor: string
  color: string
  font: string
  textPadding: number
  render?: (y: number) => string
  drawLine: boolean
  lineWidth: number
  lineColor: string
}

export type Bar = {
  x: number
  y: number
}

export type BarGraph = {
  data: Bar[]
  step: number
  getBarColor: (bar: Bar) => string
  barWidth: number
  y0: number
}

export type LineGraph = {
  data: Point[]
  step: number
  lineColor: string
  lineWidth: number
}

export type PointGraph = {
  data: Point[]
  color: string
  radius: number
  ambientColor: string
  ambientRadius: number
}

export interface BarGraphType extends Partial<BarGraph> {
  type: "bar"
}

export interface LineGraphType extends Partial<LineGraph> {
  type: "line"
}

export interface PointGraphType extends Partial<PointGraph> {
  type: "point"
}

export type Graph = BarGraphType | LineGraphType | PointGraphType
