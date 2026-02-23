import React, { useState, createContext, useContext, useMemo } from "react"

export type State = {
  hover: number | null
  pins: Set<number>
  folded: Set<number>
}

const STATE: State = { folded: new Set(), hover: null, pins: new Set() }

const Context = createContext({
  state: STATE,
  fold: (_: number) => {},
  setHover: (_: number | null) => {},
  pin: (_: number[]) => {},
})

export function useTracerContext() {
  return useContext(Context)
}

export const Provider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<State>(STATE)

  // i = call index
  const fold = (i: number) => {
    const folded = new Set(state.folded)
    if (folded.has(i)) {
      folded.delete(i)
    } else {
      folded.add(i)
    }

    setState((state) => ({
      ...state,
      folded,
    }))
  }

  // i = call index
  const setHover = (i: number | null) => {
    setState((state) => ({
      ...state,
      hover: i,
    }))
  }

  // i = call index
  const pin = (idxs: number[]) => {
    const pins = new Set(state.pins)

    for (const i of idxs) {
      if (pins.has(i)) {
        pins.delete(i)
      } else {
        pins.add(i)
      }
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

  return <Context.Provider value={value}>{children}</Context.Provider>
}
