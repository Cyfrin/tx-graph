import React, { useState, useEffect } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { useWindowSizeContext } from "../contexts/WindowSize"
import Splits from "../components/Splits"
import {
  Provider as TracerProvider,
  useTracerContext,
  State as TracerState,
} from "../contexts/Tracer"
import { Graph as CanvasGraph } from "../components/graph/Graph"
import * as GraphTypes from "../components/graph/lib/types"
import Tracer from "../components/tracer"
import * as TracerTypes from "../components/tracer/types"
import FnDef from "../components/tracer/FnDef"
import FnCall from "../components/tracer/FnCall"
import Evm from "../components/ctx/evm/tracer/Evm"
import Op from "../components/ctx/evm/tracer/Op"
import ContractDropDown from "../components/ctx/evm/tracer/ContractDropDown"
import FnDropDown from "../components/ctx/evm/tracer/FnDropDown"
import CopyText from "../components/CopyText"
import * as EvmTypes from "../components/ctx/evm/types"
import Checkbox from "../components/Checkbox"
import Modal from "../components/Modal"
import { useGetTrace, ObjType } from "../hooks/useGetTrace"
import styles from "./TxPage.module.css"

// TODO: graph - ETH and token transfers
// TODO: error handling

// Must match height in .tracerController
const TRACER_CONTROLLER_HEIGHT = 60
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
  hover: GraphTypes.Hover | null,
  arrow: GraphTypes.Arrow,
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
  objs: Map<
    GraphTypes.Id,
    GraphTypes.Obj<ObjType, EvmTypes.Account | TracerTypes.FnDef>
  >,
  hover: GraphTypes.Hover | null,
  node: GraphTypes.Node,
  graph: GraphTypes.Graph,
  tracer: TracerState,
): string {
  const obj = objs.get(node.id) as GraphTypes.Obj<
    ObjType,
    EvmTypes.Account | TracerTypes.FnDef
  >
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
  const chain = q.get("chain") || ""

  const windowSize = useWindowSizeContext()
  const tracer = useTracerContext()
  const getTrace = useGetTrace({
    txHash,
    chain,
  })
  const [checked, setChecked] = useState(false)
  const [modal, setModal] = useState<GraphTypes.Hover | null>(null)

  if (getTrace.state.trace.error) {
    return <div>error :(</div>
  }

  if (!windowSize || !getTrace.state.data) {
    return <div>loading...</div>
  }

  const { graph, calls, groups, objs, labels } = getTrace.state.data

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

  function onPointerDown(hover: GraphTypes.Hover | null) {
    setModal(hover)
  }

  function renderNode(node: number, details: boolean) {
    const obj = objs.get(node)
    // @ts-ignore
    const label = obj?.val?.name
    // @ts-ignore
    const addr = obj?.val?.addr || ""
    const fns = details
      ? // @ts-ignore
        ([...obj?.val?.fns?.values()] || []).map((v, i) => (
          <FnDef key={i} name={v.name} inputs={v.inputs} outputs={v.outputs} />
        ))
      : []

    return (
      <div className={styles.hover}>
        {label ? <div className={styles.objLabel}>{label}</div> : null}
        {addr ? <CopyText text={addr} val={addr} /> : null}
        {fns}
      </div>
    )
  }

  function renderFn(node: number) {
    const obj = objs.get(node)
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

  function renderArrows(arrows: Set<number>) {
    const nodes = []
    for (const i of arrows) {
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

  function renderModal() {
    if (!modal) {
      return null
    }
    if (modal.node != null) {
      const obj = objs.get(modal.node)
      if (obj?.type == "acc") {
        return renderNode(modal.node, true)
      }
      if (obj?.type == "fn") {
        return renderFn(modal.node)
      }
    }
    if (modal.arrows != null && modal.arrows.size > 0) {
      return renderArrows(modal.arrows)
    }
    return null
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
                  <CopyText text={txHash} val={txHash} />
                </div>
                <div className={styles.callsCount}>{calls.length} calls</div>
                <div className={styles.contractCount}>
                  {getTrace.state.q.fetched} / {getTrace.state.q.total}{" "}
                  contracts
                </div>
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
                renderCallType={(ctx) => <Op ctx={ctx} />}
                renderModDropDown={(ctx) => <ContractDropDown ctx={ctx} />}
                renderFnDropDown={(ctx) => <FnDropDown ctx={ctx} />}
                getInputLabel={(val) => labels[val?.toLowerCase()] || null}
                getOutputLabel={(val) => labels[val?.toLowerCase()] || null}
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
            onPointerDown={onPointerDown}
            getNodeStyle={(hover, node) => {
              return {
                fill: getNodeFillColor(objs, hover, node, graph, tracer.state),
                stroke: STYLES.NODE_BORDER_COLOR,
              }
            }}
            getNodeText={(hover, node) => {
              // TODO: fix
              // @ts-ignore
              const obj = objs.get(node.id) as GraphTypes.Obj<ObjType, Account>
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
                // TODO: clean / recycle
                const obj = objs.get(hover.node)
                if (obj?.type == "acc") {
                  return renderNode(hover.node, false)
                }
                if (obj?.type == "fn") {
                  return renderFn(hover.node)
                }
              }
              if (hover.arrows != null && hover.arrows.size > 0) {
                return renderArrows(hover.arrows)
              }
              return null
            }}
          />
        )}
      </Splits>
      <Modal id="graph" open={!!modal} onClose={() => setModal(null)}>
        {renderModal()}
      </Modal>
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
