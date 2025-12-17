import { useEffect } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { useWindowSizeContext } from "../contexts/WindowSize"
import { useFileStorageContext } from "../contexts/FileStorage"
import Splits, { SPLIT_HEIGHT } from "../components/Splits"
import {
  Provider as TracerProvider,
  useTracerContext,
  State as TracerState,
} from "../components/tracer/TracerContext"
import { CallGraphUi } from "../components/svg-graph/CallGraphUi"
import { Graph as CanvasGraph } from "../components/canvas/Graph"
import { Id, Graph, Node, Arrow } from "../components/svg-graph/lib/types"
import { Hover } from "../components/svg-graph/types"
import Tracer from "../components/tracer"
import Evm from "../components/ctx/evm/tracer/Evm"
import ContractDropDown from "../components/ctx/evm/tracer/ContractDropDown"
import FnDropDown from "../components/ctx/evm/tracer/FnDropDown"
import { Fn } from "../components/tracer/types"
import CopyText from "../components/CopyText"
import { Account } from "../components/ctx/evm/types"
import useAsync from "../hooks/useAsync"
import styles from "./TxPage.module.css"
import { getTrace, Obj, ObjType } from "../tracer"

// TODO: import foundry trace
// TODO: graph - ETH and token transfers
// TODO: on click graph -> pin trace
// TODO: error handling

type ArrowType = "in" | "out" | "hover" | "dim" | "pin" | "tracer" | ""

function getArrowType(
  hover: Hover,
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
  if (hover.node != null) {
    if (hover.node == arrow.s) {
      return "out"
    }
    if (hover.node == arrow.e) {
      return "in"
    }
    return "dim"
  }
  if (hover.arrows != null && hover.arrows.size > 0) {
    if (hover.arrows.has(arrow.i)) {
      return "hover"
    }
    return "dim"
  }
  return ""
}

// TODO: change text color on hover
// TODO: change node color on hover arrow
function getNodeFillColor(
  objs: Map<Id, Obj<ObjType, Account | Fn>>,
  hover: Hover,
  node: Node,
  graph: Graph,
  tracer: TracerState,
): string {
  const obj = objs.get(node.id) as Obj<ObjType, Account | Fn>
  // Arrows are hovered
  if (hover.arrows != null && hover?.arrows?.size > 0) {
    if (obj?.type == "acc") {
      return "var(--node-dim-color)"
    }
    return "transparent"
  }
  // Hover or incoming or outgoing node
  if (hover.node != null) {
    if (hover.node == node.id) {
      return "var(--node-hover-color)"
    }
    if (
      graph.incoming.get(hover.node)?.has(node.id) ||
      graph.outgoing.get(hover.node)?.has(node.id)
    ) {
      return "var(--node-hover-color)"
    }
    if (obj?.type == "acc") {
      return "var(--node-dim-color)"
    }
    return "transparent"
  }
  // Default (no hovered node or arrow)
  if (obj?.type == "acc") {
    return "var(--node-color)"
  }
  return "transparent"
}

function getArrowColor(t: ArrowType): string {
  switch (t) {
    case "in":
      return "var(--arrow-in-color)"
    case "out":
      return "var(--arrow-out-color)"
    case "hover":
      return "var(--arrow-hover-color)"
    case "dim":
      return "var(--arrow-dim-color)"
    case "pin":
      return "var(--arrow-pin-color)"
    case "tracer":
      return "var(--arrow-tracer-color)"
    default:
      return "var(--arrow-color)"
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

  return (
    <div className={styles.component}>
      <Splits>
        {() => (
          <div className={styles.tracer}>
            <div className={styles.tx}>
              <div className={styles.txHashLabel}>TX hash:</div>
              <div className={styles.txHash}>
                <CopyText text={txHash} />
              </div>
            </div>
            <Tracer
              trace={trace}
              renderCallCtx={(ctx) => <Evm ctx={ctx} />}
              renderModDropDown={(ctx) => <ContractDropDown ctx={ctx} />}
              renderFnDropDown={(ctx) => <FnDropDown ctx={ctx} />}
            />
          </div>
        )}
        {
          (rect) => (
            <CanvasGraph
              width={rect.width}
              height={rect.height}
              backgroundColor="var(--bg-dark-color)"
              groups={groups}
              calls={calls}
              tracer={tracer.state}
            />
          )
          /*(rect) => (
          <CallGraphUi
            groups={groups}
            calls={calls}
            tracer={tracer.state}
            backgroundColor="var(--bg-dark-color)"
            width={rect.width}
            height={rect.height}
            showDot={true}
            nodeWidth={220}
            nodeHeight={40}
            nodeXGap={100}
            nodeYGap={80}
            getNodeStyle={(hover, node) => {
              return {
                fill: getNodeFillColor(objs, hover, node, graph, tracer.state),
                stroke: "var(--node-border-color)",
              }
            }}
            getArrowStyle={(hover, arrow) => {
              const t = getArrowType(hover, arrow, tracer.state)
              return {
                type: t,
                style: {
                  stroke: getArrowColor(t),
                },
              }
            }}
            renderArrowText={(arrow) => {
              return `${arrow.i}`
            }}
            renderNode={(hover, node) => {
              // TODO: fix
              // @ts-ignore
              const obj = objs.get(node.id) as Obj<ObjType, Account>
              if (obj?.type == "acc") {
                return (
                  <div className={styles.accNode}>
                    <span className={styles.nodeText}>
                      {obj?.val.name || obj?.val?.addr || node.id}
                    </span>
                  </div>
                )
              }
              return (
                <div className={styles.fnNode}>
                  <span className={styles.nodeText}>
                    {obj?.val.name || node.id}
                  </span>
                </div>
              )
            }}
            renderHover={(hover, mouse) => {
              if (!mouse) {
                return null
              }
              if (hover.node != null) {
                const obj = objs.get(hover.node)
                const text =
                  obj?.val?.name ||
                  // @ts-ignore
                  (obj?.type == "acc" ? obj?.val?.addr : "?") ||
                  "?"
                return (
                  <div
                    className={styles.hoverNode}
                    style={{
                      position: "absolute",
                      top: mouse.y + 10,
                      left: mouse.x + 10,
                    }}
                  >
                    {text}
                  </div>
                )
              }
              return null
            }}
          />
        )*/
        }
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
