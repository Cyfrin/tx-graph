import React, { useState, createContext, useContext, useMemo } from "react"

export type State = {
  hover: number | null
  pins: Set<number>
  hidden: Set<number>
}

const STATE: State = { hidden: new Set(), hover: null, pins: new Set() }

const TracerContext = createContext({
  state: STATE,
  fold: (_: number) => {},
  setHover: (_: number | null) => {},
  pin: (_: number) => {},
})

export function useTracerContext() {
  return useContext(TracerContext)
}

export const Provider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<State>(STATE)

  const fold = (i: number) => {
    const hidden = new Set(state.hidden)
    if (hidden.has(i)) {
      hidden.delete(i)
    } else {
      hidden.add(i)
    }

    setState((state) => ({
      ...state,
      hidden,
    }))
  }

  const setHover = (i: number | null) => {
    setState((state) => ({
      ...state,
      hover: i,
    }))
  }

  const pin = (i: number) => {
    const pins = new Set(state.pins)
    if (pins.has(i)) {
      pins.delete(i)
    } else {
      pins.add(i)
    }

    setState((state) => ({
      ...state,
      pins,
    }))
  }

  const value = useMemo(
    () => ({
      state,
      fold,
      setHover,
      pin,
    }),
    [state],
  )

  return (
    <TracerContext.Provider value={value}>{children}</TracerContext.Provider>
  )
}
