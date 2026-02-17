import React, { useState } from "react"
import { useTracerContext } from "../../contexts/Tracer"
import XMark from "../svg/XMark"
import * as Types from "./types"
import VirtualList from "./VirtualList"
import DropDown from "./DropDown"
import Inputs from "./Inputs"
import Outputs from "./Outputs"
import Pad from "./Pad"
import Fold from "./Fold"
import styles from "./index.module.css"

// Fixed line height (must match line height in .line)
const LINE_HEIGHT = 20

type FnProps<A> = {
  call: Types.Call<A, Types.FnCall>
  hasChildren: boolean
  renderCallType?: (ctx: A) => React.ReactNode
  renderCallCtx?: (ctx: A) => React.ReactNode
  renderModDropDown?: (ctx: A) => React.ReactNode
  renderFnDropDown?: (ctx: A) => React.ReactNode
  highlights: { [key: string]: boolean }
  setHighlight: (key: string | number, on: boolean) => void
  getInputLabel?: (val: string) => string | null
  getOutputLabel?: (val: string) => string | null
}

function Fn<V>({
  call,
  hasChildren,
  renderCallType,
  renderCallCtx,
  renderModDropDown,
  renderFnDropDown,
  highlights,
  setHighlight,
  getInputLabel,
  getOutputLabel,
}: FnProps<V>) {
  const { state, fold, setHover, pin } = useTracerContext()

  const onClick = () => {
    pin([call.i])
  }

  const onClickFold = () => {
    fold(call.i)
  }

  const onMouseEnter = () => {
    setHover(call.i)
  }

  const onMouseLeave = () => {
    setHover(null)
  }

  const show = !state.hidden.has(call.i)

  return (
    <div className={styles.fn}>
      <div
        className={styles.line}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className={styles.sticky}>
          {renderCallType ? renderCallType(call?.ctx) : null}
          <div className={styles.index} onClick={onClick}>
            {state.pins.has(call.i) ? (
              <span className={styles.pin}>x</span>
            ) : (
              call.i
            )}
          </div>
        </div>
        <Pad depth={call.depth} height={LINE_HEIGHT} />
        <div className={styles.call}>
          <Fold show={show} hasChildren={hasChildren} onClick={onClickFold} />
          {!call.ok ? <XMark color="#E53935" size={16} /> : null}
          <div className={styles.obj}>
            {renderModDropDown ? (
              <DropDown
                label={call.fn.mod}
                highlight={highlights[call.fn.mod]}
                onMouseEnter={() => setHighlight(call.fn.mod, true)}
                onMouseLeave={() => setHighlight(call.fn.mod, false)}
              >
                {renderModDropDown(call.ctx)}
              </DropDown>
            ) : (
              call.fn.mod
            )}
          </div>
          <div className={styles.dot}>.</div>
          <div className={styles.funcName}>
            {renderFnDropDown ? (
              <DropDown
                label={call.fn.name}
                highlight={highlights[call.fn.name]}
                onMouseEnter={() => setHighlight(call.fn.name, true)}
                onMouseLeave={() => setHighlight(call.fn.name, false)}
              >
                {renderFnDropDown(call.ctx)}
              </DropDown>
            ) : (
              call.fn.name
            )}
          </div>
          {renderCallCtx ? renderCallCtx(call.ctx) : null}
          <div>(</div>
          <Inputs inputs={call.fn.inputs} getLabel={getInputLabel} />
          <div>)</div>
          {call.fn.outputs.length > 0 ? (
            <div className={styles.outputs}>
              <div className={styles.arrow}>{"→"}</div>
              <div>(</div>
              <Outputs outputs={call.fn.outputs} getLabel={getOutputLabel} />
              <div>)</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

type TracerProps<C> = {
  height: number
  calls: Types.Call<C, Types.FnCall>[]
  renderCallType?: (ctx: C) => React.ReactNode
  renderCallCtx?: (ctx: C) => React.ReactNode
  renderModDropDown?: (ctx: C) => React.ReactNode
  renderFnDropDown?: (ctx: C) => React.ReactNode
  getInputLabel?: (val: string) => string | null
  getOutputLabel?: (val: string) => string | null
}

function Tracer<C>({
  height,
  calls,
  renderCallType,
  renderCallCtx,
  renderModDropDown,
  renderFnDropDown,
  getInputLabel,
  getOutputLabel,
}: TracerProps<C>) {
  const tracer = useTracerContext()

  // Highlight state of modules and functions
  const [highlights, setHighlights] = useState<{ [key: string]: boolean }>({})

  const setHighlight = (key: string | number, on: boolean) => {
    setHighlights((state) => ({
      ...state,
      [key]: on,
    }))
  }

  const cs: Types.Call<C, Types.FnCall>[] = []
  let i = 0
  while (i < calls.length) {
    cs.push(calls[i])
    if (tracer.state.hidden.has(i)) {
      // Skip children
      const d = calls[i].depth
      while (calls[i + 1]?.depth > d) {
        i++
      }
    }
    i++
  }

  return (
    <div className={styles.component}>
      <VirtualList
        len={cs.length}
        lineHeight={LINE_HEIGHT}
        height={height}
        render={(i) => (
          <Fn
            call={cs[i]}
            hasChildren={calls?.[cs?.[i].i + 1]?.depth > cs?.[i]?.depth}
            renderCallType={renderCallType}
            renderCallCtx={renderCallCtx}
            renderModDropDown={renderModDropDown}
            renderFnDropDown={renderFnDropDown}
            highlights={highlights}
            setHighlight={setHighlight}
            getInputLabel={getInputLabel}
            getOutputLabel={getOutputLabel}
          />
        )}
      />
    </div>
  )
}

export default Tracer
