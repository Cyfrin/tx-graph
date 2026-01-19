import React, { useState, useEffect } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { useWindowSizeContext } from "../contexts/WindowSize"
import { useFileStorageContext } from "../contexts/FileStorage"
import Splits from "../components/Splits"
import {
  Provider as TracerProvider,
  useTracerContext,
  State as TracerState,
} from "../contexts/Tracer"
import { Graph as CanvasGraph } from "../components/canvas/Graph"
import { Id, Graph, Node, Arrow, Hover } from "../components/canvas/lib/types"
import Tracer from "../components/tracer"
import Evm from "../components/ctx/evm/tracer/Evm"
import Op from "../components/ctx/evm/tracer/Op"
import ContractDropDown from "../components/ctx/evm/tracer/ContractDropDown"
import FnDropDown from "../components/ctx/evm/tracer/FnDropDown"
import * as TracerTypes from "../components/tracer/types"
import FnDef from "../components/tracer/FnDef"
import FnCall from "../components/tracer/FnCall"
import CopyText from "../components/CopyText"
import { Account } from "../components/ctx/evm/types"
import Checkbox from "../components/Checkbox"
import useAsync from "../hooks/useAsync"
import styles from "./TxPage.module.css"
import { getTrace, Obj, ObjType } from "../tracer"

// TODO: graph - ETH and token transfers
// TODO: error handling
// TODO: hover pin or modal on click

// Must match height in .tracerController
const TRACER_CONTROLLER_HEIGHT = 55
// Must match paddings in .tracerComponent
const TRACER_PADDING_TOP = 0
const TRACER_PADDING_BOTTOM = 0

// Canvas doesn't recognize css var colors
// Don't use opaque colors (rgba) for overlapping objects (it intensifies the colors)
const STYLES = {
  BG_COLOR: "rgb(17, 17, 17)",
  NODE_BORDER_COLOR: "rgb(17, 17, 17)",
  NODE_COLOR: "rgba(12, 62, 92, 0.85)",
  NODE_TEXT_COLOR: "rgb(255, 255, 255)",
  NODE_HOVER_COLOR: "rgba(18, 85, 125, 0.9)",
  NODE_HOVER_TEXT_COLOR: "rgb(180, 240, 255)",
  NODE_HOVER_BORDER_COLOR: "rgb(70, 180, 220)",
  NODE_DIM_COLOR: "rgba(30, 42, 52, 0.7)",
  ARROW_COLOR: "rgb(160, 160, 170)",
  ARROW_DIM_COLOR: "rgb(80, 85, 95)",
  ARROW_IN_COLOR: "rgb(255, 99, 99)",
  ARROW_OUT_COLOR: "rgb(64, 196, 255)",
  ARROW_HOVER_COLOR: "rgb(200, 160, 255)",
  ARROW_PIN_COLOR: "rgb(255, 215, 0)",
  ARROW_TRACER_COLOR: "rgb(0, 255, 136)",
}

type ArrowType = "in" | "out" | "hover" | "dim" | "pin" | "tracer" | ""

function getArrowType(
  hover: Hover | null,
  arrow: Arrow,
  tracer: TracerState,
): ArrowType {
  if (tracer.pins.has(arrow.i)) {
    return "pin"
  }
  if (tracer.hover != null) {
    if (tracer.hover == arrow.i) {
      return "tracer"
    }
    return "dim"
  }

  if (hover?.node != null) {
    if (hover.node == arrow.s) {
      return "out"
    }
    if (hover.node == arrow.e) {
      return "in"
    }
    return "dim"
  }
  if (hover?.arrows != null && hover?.arrows.size > 0) {
    if (hover.arrows.has(arrow.i)) {
      return "hover"
    }
    return "dim"
  }
  return ""
}

function getNodeFillColor(
  objs: Map<Id, Obj<ObjType, Account | TracerTypes.FnDef>>,
  hover: Hover | null,
  node: Node,
  graph: Graph,
  tracer: TracerState,
): string {
  const obj = objs.get(node.id) as Obj<ObjType, Account | TracerTypes.FnDef>
  // Arrows are hovered
  if (hover?.arrows && hover?.arrows?.size > 0) {
    if (obj?.type == "acc") {
      return STYLES.NODE_DIM_COLOR
    }
    return "transparent"
  }
  // Hover or incoming or outgoing node
  if (hover) {
    if (hover?.node != null) {
      if (hover?.node == node.id) {
        return STYLES.NODE_HOVER_COLOR
      }
      if (
        graph.incoming.get(hover.node)?.has(node.id) ||
        graph.outgoing.get(hover.node)?.has(node.id)
      ) {
        return STYLES.NODE_HOVER_COLOR
      }
      if (obj?.type == "acc") {
        return STYLES.NODE_DIM_COLOR
      }
      return "transparent"
    }
  }
  // Default (no hovered node or arrow)
  if (obj?.type == "acc") {
    return STYLES.NODE_COLOR
  }
  return "transparent"
}

function getArrowColor(t: ArrowType): string {
  switch (t) {
    case "in":
      return STYLES.ARROW_IN_COLOR
    case "out":
      return STYLES.ARROW_OUT_COLOR
    case "hover":
      return STYLES.ARROW_HOVER_COLOR
    case "dim":
      return STYLES.ARROW_DIM_COLOR
    case "pin":
      return STYLES.ARROW_PIN_COLOR
    case "tracer":
      return STYLES.ARROW_TRACER_COLOR
    default:
      return STYLES.ARROW_COLOR
  }
}

// TODO: light theme
function TxPage() {
  const { txHash = "" } = useParams()
  const [q] = useSearchParams()
  const chain = q.get("chain")

  const windowSize = useWindowSizeContext()
  const fileStorage = useFileStorageContext()
  const tracer = useTracerContext()
  const _getTrace = useAsync(getTrace)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (txHash && chain) {
      const f = async () => {
        await _getTrace.exec({ txHash, chain, get: fileStorage.get })
      }
      f()
    }
  }, [txHash, chain])

  if (_getTrace.error) {
    console.log("ERROR", _getTrace.error)
    return <div>error :(</div>
  }

  if (!windowSize || !_getTrace.data) {
    return <div>loading...</div>
  }

  const { trace, graph, calls, groups, objs, arrows } = _getTrace.data

  function onCheck() {
    setChecked(!checked)

    const idxs: number[] = []
    for (let i = 0; i < calls.length; i++) {
      // @ts-ignore
      if (calls[i].ctx.val > 0) {
        idxs.push(i)
      }
    }

    if (idxs.length > 0) {
      tracer.pin(idxs)
    }
  }

  return (
    <div className={styles.component}>
      <Splits>
        {(rect) => (
          <div className={styles.tracer}>
            <div className={styles.tracerController}>
              <div className={styles.tx}>
                <div className={styles.txHashLabel}>TX hash:</div>
                <div className={styles.txHash}>
                  <CopyText text={txHash} />
                </div>
                <div>{calls.length} calls</div>
              </div>
              <Checkbox checked={checked} onChange={onCheck}>
                Pin ETH transfers
              </Checkbox>
            </div>
            <div className={styles.tracerComponent}>
              <Tracer
                height={
                  rect.height -
                  TRACER_CONTROLLER_HEIGHT -
                  TRACER_PADDING_TOP -
                  TRACER_PADDING_BOTTOM
                }
                calls={calls}
                renderCallCtx={(ctx) => <Evm ctx={ctx} />}
                /* @ts-ignore */
                renderCallType={(ctx) => <Op ctx={ctx} />}
                renderModDropDown={(ctx) => <ContractDropDown ctx={ctx} />}
                renderFnDropDown={(ctx) => <FnDropDown ctx={ctx} />}
              />
            </div>
          </div>
        )}
        {(rect, dragging) => (
          <CanvasGraph
            disabled={dragging}
            width={rect.width}
            height={rect.height}
            backgroundColor={STYLES.BG_COLOR}
            groups={groups}
            calls={calls}
            tracer={tracer.state}
            getNodeStyle={(hover, node) => {
              return {
                fill: getNodeFillColor(objs, hover, node, graph, tracer.state),
                stroke: STYLES.NODE_BORDER_COLOR,
              }
            }}
            getNodeText={(hover, node) => {
              // TODO: fix
              // @ts-ignore
              const obj = objs.get(node.id) as Obj<ObjType, Account>
              return {
                txt: `${obj?.val.name || obj?.val?.addr || node.id || ""}`,
                top: obj?.type == "acc",
              }
            }}
            getArrowStyle={(hover, arrow) => {
              const top =
                hover?.node == arrow.i ||
                hover?.arrows?.has(arrow.i) ||
                tracer.state.hover == arrow.i ||
                tracer.state.pins.has(arrow.i)
              const t = getArrowType(hover, arrow, tracer.state)
              return {
                top,
                style: {
                  stroke: getArrowColor(t),
                },
              }
            }}
            renderHover={(hover, mouse) => {
              if (!mouse) {
                return null
              }
              if (hover.node != null) {
                const obj = objs.get(hover.node)
                if (obj?.type == "acc") {
                  // @ts-ignore
                  const label = obj?.val?.name || obj?.val?.addr || "?"
                  // @ts-ignore
                  const addr = obj?.val?.addr || ""
                  return (
                    <div className={styles.hover}>
                      <div>{label}</div>
                      {addr ? <div className={styles.addr}>{addr}</div> : null}
                    </div>
                  )
                }
                if (obj?.type == "fn") {
                  const fn = obj?.val?.name || ""
                  // @ts-ignore
                  const inputs = obj?.val?.inputs || []
                  // @ts-ignore
                  const outputs = obj?.val?.outputs || []

                  if (fn) {
                    return (
                      <div className={styles.hover}>
                        <FnDef name={fn} inputs={inputs} outputs={outputs} />
                      </div>
                    )
                  }
                  return (
                    <div className={styles.hover}>
                      <div>?</div>
                    </div>
                  )
                }
              }
              if (hover.arrows != null && hover.arrows.size > 0) {
                const nodes = []
                for (const i of hover.arrows) {
                  const call = calls[i]
                  const src = objs.get(call.src)
                  const dst = objs.get(call.dst)
                  nodes.push({
                    i,
                    // @ts-ignore
                    src: src?.val?.mod || call?.ctx?.src || "?",
                    // @ts-ignore
                    dst: dst?.val?.mod || call?.ctx?.dst || "?",
                    val: call?.ctx?.val || 0,
                    type: call?.ctx?.type || "",
                    fn: dst?.val?.name || "",
                    inputs: call?.fn?.inputs || [],
                    outputs: call?.fn?.outputs || [],
                  })
                }

                return (
                  <div className={styles.hover}>
                    {nodes.map((node) => {
                      return (
                        <div key={node.i} className={styles.arrow}>
                          <div className={styles.arrowIndex}>{node.i}</div>
                          <div className={styles.arrowSrc}>{node.src}</div>
                          <div>{`→`}</div>
                          <div className={styles.arrowDst}>{node.dst}</div>
                          <div>.</div>
                          <FnCall
                            name={node.fn}
                            val={node.val}
                            inputs={node.inputs}
                            outputs={node.outputs}
                          />
                        </div>
                      )
                    })}
                  </div>
                )
              }
              return null
            }}
          />
        )}
      </Splits>
    </div>
  )
}

export default () => {
  return (
    <TracerProvider>
      <TxPage />
    </TracerProvider>
  )
}
