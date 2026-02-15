import React, { useState, useEffect, createContext, useContext } from "react"

export type State = {
  width: number
  height: number
}

const Context = createContext<State | null>(null)

export function useWindowSizeContext() {
  return useContext(Context)
}

export const Provider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<State | null>(null)

  useEffect(() => {
    const resize = () => {
      setState({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    resize()

    window.addEventListener("resize", resize)

    return () => {
      window.removeEventListener("resize", resize)
    }
  }, [])

  return <Context.Provider value={state}>{children}</Context.Provider>
}
