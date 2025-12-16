import { XAxisAlign, YAxisAlign, Layout } from "./types"

type Params = {
  padding: number
  width: number
  height: number
  xAxis: {
    xAxisAlign: XAxisAlign
    xAxisHeight: number
  }
  yAxis: {
    yAxisAlign: YAxisAlign
    yAxisWidth: number
  }
}

export function getLayout(params: Params): Layout {
  const {
    padding,
    width,
    height,
    xAxis: { xAxisAlign, xAxisHeight },
    yAxis: { yAxisAlign, yAxisWidth },
  } = params

  return {
    graph: {
      top: xAxisAlign == "top" ? padding + xAxisHeight : padding,
      left: yAxisAlign == "left" ? padding + yAxisWidth : padding,
      width: width - 2 * padding - yAxisWidth,
      height: height - 2 * padding - xAxisHeight,
    },
    xAxis: {
      top: xAxisAlign == "top" ? padding : height - padding - xAxisHeight,
      left: yAxisAlign == "left" ? padding + yAxisWidth : padding,
      width: width - 2 * padding - yAxisWidth,
      height: xAxisHeight,
    },
    yAxis: {
      top: xAxisAlign == "top" ? padding + xAxisHeight : padding,
      left: yAxisAlign == "left" ? padding : width - padding - yAxisWidth,
      width: yAxisWidth,
      height: height - 2 * padding - xAxisHeight,
    },
  }
}
