import React from "react"

import { Point, Rect } from "./lib/types"
import * as math from "./lib/math"

const FONT = "sans-serif"
const FONT_SIZE = 18

export type ArrowType = "arrow" | "zigzag" | "callback"

export type ViewBox = {
  x: number
  y: number
  width: number
  height: number
}

export function getArrowType(p0: Point, p1: Point): ArrowType {
  if (p0.y == p1.y) {
    return "arrow"
  }
  if (p1.x <= p0.x) {
    return "callback"
  }
  return "zigzag"
}

export function poly(
  p0: Point,
  p1: Point,
  xPadd: number = 0,
  yPadd: number = 0,
): Point[] {
  const type = getArrowType(p0, p1)
  switch (type) {
    case "zigzag": {
      const mid = (p0.x + p1.x) >> 1
      return [p0, { x: mid, y: p0.y }, { x: mid, y: p1.y }, p1]
    }
    case "callback": {
      return [
        p0,
        { x: p0.x + xPadd, y: p0.y },
        { x: p0.x + xPadd, y: p1.y + yPadd },
        { x: p1.x, y: p1.y + yPadd },
        p1,
      ]
    }
    default:
      return [p0, p1]
  }
}

export function box(
  points: Point[],
  xPadd: number = 0,
  yPadd: number = 0,
): Rect {
  let xMin = points[0].x
  let xMax = points[0].x
  let yMin = points[0].y
  let yMax = points[0].y

  for (let i = 1; i < points.length; i++) {
    const p = points[i]
    if (p.x < xMin) {
      xMin = p.x
    }
    if (p.y < yMin) {
      yMin = p.y
    }
    if (p.x > xMax) {
      xMax = p.x
    }
    if (p.y > yMax) {
      yMax = p.y
    }
  }

  return {
    x: xMin - xPadd,
    y: yMin - yPadd,
    width: xMax - xMin + 2 * xPadd,
    height: yMax - yMin + 2 * yPadd,
  }
}

export function getViewBoxX(
  width: number,
  mouseX: number,
  viewBoxWidth: number,
  viewBoxX: number,
): number {
  return math.lin(viewBoxWidth, width, mouseX, viewBoxX)
}

export function getViewBoxY(
  height: number,
  mouseY: number,
  viewBoxHeight: number,
  viewBoxY: number,
): number {
  return math.lin(viewBoxHeight, height, mouseY, viewBoxY)
}

export const SvgRect: React.FC<{
  x: number
  y: number
  width: number
  height: number
  rx?: number
  ry?: number
  fill?: string
  stroke?: string
  strokeWidth?: number
}> = ({
  x,
  y,
  width,
  height,
  fill = "none",
  stroke = "black",
  strokeWidth = 2,
  rx = 8,
  ry = 8,
}) => {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      rx={rx}
      ry={ry}
    />
  )
}

export const SvgArrow: React.FC<{
  x0: number
  y0: number
  x1: number
  y1: number
  stroke?: string
  strokeWidth?: number
  text?: string | number
  textXGap?: number
  textYGap?: number
  type?: string
}> = ({
  x0,
  y0,
  x1,
  y1,
  stroke = "black",
  strokeWidth = 2,
  text,
  textXGap = 0,
  textYGap = -10,
  type = "",
}) => {
  const id = `arrow-${type}`
  return (
    <>
      <defs>
        <marker
          id={id}
          markerWidth="5"
          markerHeight="5"
          refX="5"
          refY="2.5"
          orient="auto"
        >
          <path fill={stroke} stroke={stroke} d="M 0 0 L 5 2.5 L 0 5 z" />
        </marker>
      </defs>
      <line
        className="flow"
        x1={x0}
        y1={y0}
        x2={x1}
        y2={y1}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        markerEnd={`url(#${id})`}
      />

      {text ? (
        <text
          x={((x0 + x1) >> 1) + textXGap}
          y={y0 + textYGap}
          fontFamily={FONT}
          fontSize={FONT_SIZE}
          fill={stroke}
          stroke={stroke}
          textAnchor="middle"
          dominantBaseline="middle"
          textRendering="optimizeLegibility"
        >
          {text}
        </text>
      ) : null}
    </>
  )
}

export const SvgZigZagArrow: React.FC<{
  x0: number
  y0: number
  x1: number
  y1: number
  stroke?: string
  strokeWidth?: number
  text?: string | number
  textXGap?: number
  textYGap?: number
  type?: string
}> = ({
  x0,
  y0,
  x1,
  y1,
  stroke = "black",
  strokeWidth = 2,
  text,
  textXGap = -14,
  textYGap = -14,
  type = "",
}) => {
  const midX = (x0 + x1) >> 1
  const id = `zig-zag-arrow-${type}`

  return (
    <>
      <defs>
        <marker
          id={id}
          markerWidth="5"
          markerHeight="5"
          refX="5"
          refY="2.5"
          orient="auto"
          stroke={stroke}
        >
          <path fill={stroke} color={stroke} d="M 0 0 L 5 2.5 L 0 5 z" />
        </marker>
      </defs>
      <line
        className="flow"
        x1={x0}
        y1={y0}
        x2={midX}
        y2={y0}
        stroke={stroke}
        strokeWidth="2"
      />
      <line
        className="flow"
        x1={midX}
        y1={y0}
        x2={midX}
        y2={y1}
        stroke={stroke}
        strokeWidth="2"
      />
      <line
        className="flow"
        x1={midX}
        y1={y1}
        x2={x1}
        y2={y1}
        stroke={stroke}
        strokeWidth={strokeWidth}
        markerEnd={`url(#${id})`}
      />
      {text ? (
        <text
          x={midX + textXGap}
          y={y1 + textYGap}
          fontFamily={FONT}
          fontSize={FONT_SIZE}
          fill={stroke}
          stroke={stroke}
          textAnchor="end"
          dominantBaseline="middle"
          textRendering="optimizeLegibility"
        >
          {text}
        </text>
      ) : null}
    </>
  )
}

export const SvgCallBackArrow: React.FC<{
  x0: number
  y0: number
  x1: number
  y1: number
  xPadd: number
  yPadd: number
  stroke?: string
  strokeWidth?: number
  text?: string | number
  textXGap?: number
  textYGap?: number
  type?: string
}> = ({
  x0,
  y0,
  x1,
  y1,
  xPadd,
  yPadd,
  stroke = "black",
  strokeWidth = 2,
  text,
  textXGap = 0,
  textYGap = -14,
  type = "",
}) => {
  // x0 >= x1 and y1 >= y0
  const id = `call-back-arrow-${type}`
  return (
    <>
      <defs>
        <marker
          id={id}
          markerWidth="5"
          markerHeight="5"
          refX="5"
          refY="2.5"
          orient="auto"
        >
          <path fill={stroke} stroke={stroke} d="M 0 0 L 5 2.5 L 0 5 z" />
        </marker>
      </defs>
      <line
        className="flow"
        x1={x0}
        y1={y0}
        x2={x0 + xPadd}
        y2={y0}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <line
        className="flow"
        x1={x0 + xPadd}
        y1={y0}
        x2={x0 + xPadd}
        y2={y1 + yPadd}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <line
        className="flow"
        x1={x0 + xPadd}
        y1={y1 + yPadd}
        x2={x1}
        y2={y1 + yPadd}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <line
        className="flow"
        x1={x1}
        y1={y1 + yPadd}
        x2={x1}
        y2={y1}
        stroke={stroke}
        strokeWidth={strokeWidth}
        markerEnd={`url(#${id})`}
      />
      {text ? (
        <text
          x={x1 + textXGap}
          y={y1 + yPadd + textYGap}
          fontFamily={FONT}
          fontSize={FONT_SIZE}
          fill={stroke}
          stroke={stroke}
          textAnchor="start"
          dominantBaseline="middle"
          textRendering="optimizeLegibility"
        >
          {text}
        </text>
      ) : null}
    </>
  )
}

export const SvgDot: React.FC<{
  x: number
  y: number
  radius: number
  fill?: string
}> = ({ x, y, radius, fill = "red" }) => {
  return <circle cx={x} cy={y} r={radius} fill={fill} />
}
