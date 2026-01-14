import React, { useState } from "react"
import styles from "./index.module.css"
import { Trace } from "./types"
import { useTracerContext } from "../../contexts/Tracer"
import Chevron from "../svg/Chevron"
import DropDown from "./DropDown"
import Inputs from "./Inputs"
import Outputs from "./Outputs"

const Padd: React.FC<{ depth: number }> = ({ depth }) => {
  if (depth === 0) return null

  // Width matches fold symbol (+, -) sizes
  return (
    <div
      style={{
        width: depth * 18,
        height: "100%",
        backgroundImage:
          "repeating-linear-gradient(to right, transparent 0, transparent 17px, grey 17px, grey 18px)",
        backgroundSize: "18px 100%",
        backgroundPosition: "9px 0",
      }}
    />
  )
}

const Fold: React.FC<{
  show: boolean
  hasChildren: boolean
  onClick: () => void
}> = ({ show, hasChildren, onClick }) => {
  return (
    <div className={styles.fold}>
      {hasChildren ? (
        <Chevron
          size={18}
          className={show ? styles.chevronDown : styles.chevronRight}
          onClick={onClick}
        />
      ) : null}
    </div>
  )
}

type FnProps<V> = {
  trace: Trace<V>
  renderCallType?: (ctx: V) => React.ReactNode
  renderCallCtx?: (ctx: V) => React.ReactNode
  renderModDropDown?: (ctx: V) => React.ReactNode
  renderFnDropDown?: (ctx: V) => React.ReactNode
  highlights: { [key: string]: boolean }
  setHighlight: (key: string | number, on: boolean) => void
}

function Fn<V>({
  trace,
  renderCallType,
  renderCallCtx,
  renderModDropDown,
  renderFnDropDown,
  highlights,
  setHighlight,
}: FnProps<V>) {
  const { state, fold, setHover, pin } = useTracerContext()

  const onClick = () => {
    pin([trace.i])
  }

  const onClickFold = () => {
    fold(trace.i)
  }

  const onMouseEnter = () => {
    setHover(trace.i)
  }

  const onMouseLeave = () => {
    setHover(null)
  }

  const show = !state.hidden.has(trace.i)

  return (
    <div className={styles.fn}>
      <div
        className={styles.line}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {renderCallType ? renderCallType(trace?.ctx) : null}
        <div className={styles.index} onClick={onClick}>
          {state.pins.has(trace.i) ? (
            <span className={styles.pin}>x</span>
          ) : (
            trace.i
          )}
        </div>
        <Padd depth={trace.depth} />
        <div className={styles.call}>
          <Fold
            show={show}
            hasChildren={trace.calls.length > 0}
            onClick={onClickFold}
          />
          <div className={styles.obj}>
            {renderModDropDown ? (
              <DropDown
                label={trace.fn.mod}
                highlight={highlights[trace.fn.mod]}
                onMouseEnter={() => setHighlight(trace.fn.mod, true)}
                onMouseLeave={() => setHighlight(trace.fn.mod, false)}
              >
                {renderModDropDown(trace.ctx)}
              </DropDown>
            ) : (
              trace.fn.mod
            )}
          </div>
          <div className={styles.dot}>.</div>
          <div className={styles.funcName}>
            {renderFnDropDown ? (
              <DropDown
                label={trace.fn.name}
                highlight={highlights[trace.fn.name]}
                onMouseEnter={() => setHighlight(trace.fn.name, true)}
                onMouseLeave={() => setHighlight(trace.fn.name, false)}
              >
                {renderFnDropDown(trace.ctx)}
              </DropDown>
            ) : (
              trace.fn.name
            )}
          </div>
          {renderCallCtx ? renderCallCtx(trace.ctx) : null}
          <div>(</div>
          <Inputs inputs={trace.fn.inputs} />
          <div>)</div>
          {trace.fn.outputs.length > 0 ? (
            <div className={styles.outputs}>
              <div className={styles.arrow}>{"→"}</div>
              <div>(</div>
              <Outputs outputs={trace.fn.outputs} />
              <div>)</div>
            </div>
          ) : null}
        </div>
      </div>
      {show
        ? trace.calls.map((t) => (
            <Fn
              key={t.i}
              trace={t}
              renderCallType={renderCallType}
              renderCallCtx={renderCallCtx}
              renderModDropDown={renderModDropDown}
              renderFnDropDown={renderFnDropDown}
              highlights={highlights}
              setHighlight={setHighlight}
            />
          ))
        : null}
    </div>
  )
}

type TracerProps<V> = {
  trace: Trace<V>
  renderCallType?: (ctx: V) => React.ReactNode
  renderCallCtx?: (ctx: V) => React.ReactNode
  renderModDropDown?: (ctx: V) => React.ReactNode
  renderFnDropDown?: (ctx: V) => React.ReactNode
}

function Tracer<V>({
  trace,
  renderCallType,
  renderCallCtx,
  renderModDropDown,
  renderFnDropDown,
}: TracerProps<V>) {
  // Highlight state of modules and functions
  const [highlights, setHighlights] = useState<{ [key: string]: boolean }>({})

  const setHighlight = (key: string | number, on: boolean) => {
    setHighlights((state) => ({
      ...state,
      [key]: on,
    }))
  }

  return (
    <div className={styles.component}>
      <Fn
        trace={trace}
        renderCallType={renderCallType}
        renderCallCtx={renderCallCtx}
        renderModDropDown={renderModDropDown}
        renderFnDropDown={renderFnDropDown}
        highlights={highlights}
        setHighlight={setHighlight}
      />
    </div>
  )
}

export default Tracer
