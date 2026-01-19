import React, { useState } from "react"
import styles from "./index.module.css"
import { Call } from "./types"
import { useTracerContext } from "../../contexts/Tracer"
import Chevron from "../svg/Chevron"
import VirtualList from "./VirtualList"
import DropDown from "./DropDown"
import Inputs from "./Inputs"
import Outputs from "./Outputs"

// Fixed line height (must match line height in .line)
const LINE_HEIGHT = 20

// TODO: use css or svg
const Padd: React.FC<{ depth: number }> = ({ depth }) => {
  const lines = []
  for (let i = 0; i < depth; i++) {
    lines.push(<div key={i} className={styles.pad} />)
  }
  return lines
}

/*
const Padd: React.FC<{ depth: number }> = ({ depth }) => {
  if (depth === 0) return null

  // Width matches pad style: 9px padding + 1px border = 10px per depth
  return (
    <div
      style={{
        width: depth * 10,
        height: "100%",
        backgroundImage:
          "repeating-linear-gradient(to right, transparent 0, transparent 9px, grey 9px, grey 10px)",
        backgroundSize: "10px 100%",
        backgroundPosition: "0 0",
      }}
    />
  )
}
*/

const Fold: React.FC<{
  show: boolean
  hasChildren: boolean
  onClick: () => void
}> = ({ show, hasChildren, onClick }) => {
  return (
    <div className={styles.fold}>
      {hasChildren ? (
        <Chevron
          size={19}
          className={show ? styles.chevronDown : styles.chevronRight}
          onClick={onClick}
        />
      ) : null}
    </div>
  )
}

type FnProps<A> = {
  call: Call<A>
  hasChildren: boolean
  renderCallType?: (ctx: A) => React.ReactNode
  renderCallCtx?: (ctx: A) => React.ReactNode
  renderModDropDown?: (ctx: A) => React.ReactNode
  renderFnDropDown?: (ctx: A) => React.ReactNode
  highlights: { [key: string]: boolean }
  setHighlight: (key: string | number, on: boolean) => void
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
        {renderCallType ? renderCallType(call?.ctx) : null}
        <div className={styles.index} onClick={onClick}>
          {state.pins.has(call.i) ? (
            <span className={styles.pin}>x</span>
          ) : (
            call.i
          )}
        </div>
        <Padd depth={call.depth} />
        <div className={styles.call}>
          <Fold show={show} hasChildren={hasChildren} onClick={onClickFold} />
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
          <Inputs inputs={call.fn.inputs} />
          <div>)</div>
          {call.fn.outputs.length > 0 ? (
            <div className={styles.outputs}>
              <div className={styles.arrow}>{"→"}</div>
              <div>(</div>
              <Outputs outputs={call.fn.outputs} />
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
  calls: Call<C>[]
  renderCallType?: (ctx: C) => React.ReactNode
  renderCallCtx?: (ctx: C) => React.ReactNode
  renderModDropDown?: (ctx: C) => React.ReactNode
  renderFnDropDown?: (ctx: C) => React.ReactNode
}

function Tracer<C>({
  height,
  calls,
  renderCallType,
  renderCallCtx,
  renderModDropDown,
  renderFnDropDown,
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

  const cs: Call<C>[] = []
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
          />
        )}
      />
    </div>
  )
}

export default Tracer
