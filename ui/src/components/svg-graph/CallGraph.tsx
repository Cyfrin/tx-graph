import React, { useMemo } from "react"
import { Groups, Call, Point, Node, Arrow } from "./lib/types"
import { Hover, Tracer } from "./types"
import * as screen from "./lib/screen"
import * as Svg from "./Svg"
import {
  ViewBox,
  SvgRect,
  SvgDot,
  SvgArrow,
  SvgZigZagArrow,
  SvgCallBackArrow,
} from "./Svg"
import * as math from "./lib/math"

const TEXT_GAP = -30
const STEP = 50
const MIN_STEPS = 4
// Radius around mouse
const R = 25
const BOX_X_PADD = 10
const BOX_Y_PADD = 10

const DEFAULT_FILL = "none"
const DEFAULT_STROKE = "black"

function sample(a: Arrow, xPadd: number = 0, yPadd: number = 0): Point[] {
  const ps = Svg.poly(a.p0, a.p1, xPadd, yPadd)
  const [len] = math.len(ps)

  const n = Math.max(len > STEP ? (len / STEP) | 0 : MIN_STEPS, MIN_STEPS)

  return math.sample(n, (i) => {
    const t = i / n
    return math.perp(ps, t)
  })
}

export const CallGraph: React.FC<{
  groups: Groups
  calls: Call[]
  tracer?: Tracer
  backgroundColor: string
  width: number
  height: number
  viewBox: ViewBox
  mouse: Point | null
  dragging: boolean
  showDot?: boolean
  getNodeStyle?: (
    hover: Hover,
    node: Node,
  ) => { fill?: string; stroke?: string }
  getArrowStyle?: (
    hover: Hover,
    arrow: Arrow,
  ) => { type: string; style: { stroke?: string } }
  nodeWidth?: number
  nodeHeight?: number
  nodeXGap?: number
  nodeYGap?: number
  renderNode?: (hover: Hover, node: Node) => React.ReactNode
  renderArrowText?: (arrow: Arrow) => string | number
  renderHover?: (hover: Hover, mouse: Point | null) => React.ReactNode
}> = ({
  groups,
  calls,
  tracer,
  backgroundColor,
  width,
  height,
  viewBox,
  mouse,
  dragging,
  showDot = false,
  getNodeStyle = () => ({ fill: DEFAULT_FILL, stroke: DEFAULT_STROKE }),
  getArrowStyle = () => ({ type: "", style: { stroke: DEFAULT_STROKE } }),
  renderArrowText = (arrow) => arrow.i,
  renderNode = () => null,
  renderHover = () => null,
  nodeWidth = 100,
  nodeHeight = 50,
  nodeXGap = 50,
  nodeYGap = 50,
}) => {
  const arrowXPadd = nodeXGap >> 1
  const arrowYPadd = nodeYGap >> 1
  const layout = useMemo(() => {
    return screen.map(groups, calls, {
      width,
      height,
      center: {
        x: width >> 1,
        y: height >> 1,
      },
      node: {
        width: nodeWidth,
        height: nodeHeight,
        gap: {
          x: nodeXGap,
          y: nodeYGap,
        },
      },
    })
  }, [calls, width, height])

  const svgX = mouse
    ? Svg.getViewBoxX(width, mouse.x, viewBox.width, viewBox.x)
    : 0
  const svgY = mouse
    ? Svg.getViewBoxY(height, mouse.y, viewBox.height, viewBox.y)
    : 0
  const mouseSvgXY = { x: svgX, y: svgY }

  const hover: Hover = { node: null, arrows: null }
  if (!dragging && mouse && svgX != 0 && svgY != 0) {
    for (const node of layout.nodes.values()) {
      if (screen.isInside(mouseSvgXY, node.rect)) {
        // Assign to the last node that the mouse is hovering - don't break from for loop
        hover.node = node.id
      }
    }

    if (hover.node == null) {
      hover.arrows = new Set()

      for (let i = 0; i < layout.arrows.length; i++) {
        const a = layout.arrows[i]
        let yPadd = -arrowYPadd
        if (Svg.getArrowType(a.p0, a.p1) == "callback") {
          const g = layout.rev.get(a.e)
          if (g != undefined) {
            const group = layout.nodes.get(g)
            if (group) {
              yPadd -= a.p1.y - group.rect.y
            }
          }
        }
        const box = Svg.box(
          Svg.poly(a.p0, a.p1, arrowXPadd, yPadd),
          BOX_X_PADD,
          BOX_Y_PADD,
        )
        if (screen.isInside(mouseSvgXY, box)) {
          const points = sample(a, arrowXPadd, yPadd)
          for (let i = 0; i < points.length; i++) {
            if (math.dist(points[i], mouseSvgXY) < R) {
              hover.arrows.add(a.i)
            }
          }
        }
      }
    }
  }

  const renderArrow = (a: Arrow, type: string, style: { stroke?: string }) => {
    // TODO:: fix arrow text overlap
    if (a.p0.y == a.p1.y) {
      return (
        <SvgArrow
          x0={a.p0.x}
          y0={a.p0.y}
          x1={a.p1.x}
          y1={a.p1.y}
          type={type}
          stroke={style?.stroke || DEFAULT_STROKE}
          text={renderArrowText(a)}
          textYGap={TEXT_GAP}
        />
      )
    }
    if (a.p1.x <= a.p0.x) {
      // Call back arrow goes above the position of the destination group
      const g = layout.rev.get(a.e)
      let yPadd = -arrowYPadd
      if (g != undefined) {
        const group = layout.nodes.get(g)
        if (group) {
          yPadd -= a.p1.y - group.rect.y
        }
      }
      /* Use for debugging
      const points = sample(a, arrowXPadd, yPadd)
      {points.map((p) => (
        <SvgDot x={p.x} y={p.y} radius={10} fill="rgba(255, 0, 0, 0.5)" />
      ))}
      */
      return (
        <SvgCallBackArrow
          x0={a.p0.x}
          y0={a.p0.y}
          x1={a.p1.x}
          y1={a.p1.y}
          xPadd={arrowXPadd}
          yPadd={yPadd}
          type={type}
          stroke={style?.stroke || DEFAULT_STROKE}
          text={renderArrowText(a)}
          textYGap={TEXT_GAP}
        />
      )
    }
    return (
      <SvgZigZagArrow
        x0={a.p0.x}
        y0={a.p0.y}
        x1={a.p1.x}
        y1={a.p1.y}
        type={type}
        stroke={style?.stroke || DEFAULT_STROKE}
        text={renderArrowText(a)}
        textYGap={0}
      />
    )
  }

  return (
    <div style={{ width, height, position: "relative" }}>
      <svg
        width={width}
        height={height}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        style={{ backgroundColor }}
      >
        {layout.arrows.map((a, i) => {
          // Render arrows that are not hovered
          if (
            a.s == hover.node ||
            a.e == hover.node ||
            a.s == tracer?.hover ||
            a.e == tracer?.hover
          ) {
            return null
          }
          const style = getArrowStyle(hover, a)
          return (
            <React.Fragment key={`arrow-${i}`}>
              {renderArrow(a, style.type, style.style)}
            </React.Fragment>
          )
        })}

        {[...layout.nodes.values()].map((node, i) => {
          const style = getNodeStyle(hover, node)
          return (
            <SvgRect
              key={`node-${i}`}
              x={node.rect.x}
              y={node.rect.y}
              width={node.rect.width}
              height={node.rect.height}
              fill={style?.fill || DEFAULT_FILL}
              stroke={style?.stroke || DEFAULT_STROKE}
            />
          )
        })}

        {[...layout.nodes.values()].map((node, i) => {
          return (
            <foreignObject
              key={`obj-${i}`}
              x={node.rect.x}
              y={node.rect.y}
              width={node.rect.width}
              height={node.rect.height}
            >
              {renderNode(hover, node)}
            </foreignObject>
          )
        })}

        {layout.arrows.map((a, i) => {
          // Render arrows that are hovered last
          if (
            a.s != hover.node &&
            a.e != hover.node &&
            a.s != tracer?.hover &&
            a.e != tracer?.hover
          ) {
            return null
          }
          const style = getArrowStyle(hover, a)
          return (
            <React.Fragment key={`arrow-hover-${i}`}>
              {renderArrow(a, style.type, style.style)}
            </React.Fragment>
          )
        })}

        {mouse && showDot ? (
          <SvgDot x={svgX} y={svgY} radius={R} fill="rgba(255, 0, 0, 0.5)" />
        ) : null}
      </svg>
      {renderHover(hover, mouse)}
    </div>
  )
}
