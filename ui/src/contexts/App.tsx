import React, { useReducer, createContext, useContext, useMemo } from "react"
import { Mode } from "../types/app"

// Local storage keys
const KEY = "local"

type LocalStorageData = {
  mode: string
  rpc: string
  etherscan: string
}

type State = {
  initialized: boolean
  mode: Mode
  rpc: string
  // API key
  etherscan: string
}

interface Init {
  type: "INIT"
  mode: Mode
}

interface SetMode {
  type: "SET_MODE"
  mode: Mode
}

interface SetRpc {
  type: "SET_RPC"
  rpc: string
}

interface SetEtherscan {
  type: "SET_ETHERSCAN"
  etherscan: string
}

type Action = Init | SetMode | SetRpc | SetEtherscan

const STATE: State = {
  initialized: false,
  mode: "dark",
  rpc: "",
  etherscan: "",
}

function reducer(state: State = STATE, action: Action): State {
  switch (action.type) {
    case "INIT": {
      return {
        ...state,
        initialized: true,
      }
    }
    case "SET_MODE": {
      return {
        ...state,
        mode: action.mode,
      }
    }
    case "SET_RPC": {
      return {
        ...state,
        rpc: action.rpc,
      }
    }
    case "SET_ETHERSCAN": {
      return {
        ...state,
        etherscan: action.etherscan,
      }
    }
    default:
      return state
  }
}

type AppContext = {
  state: State
  init: () => void
  setMode: (mode: Mode) => void
  setRpc: (rpc: string) => void
  setEtherscan: (etherscan: string) => void
}

const Context = createContext<AppContext>({
  state: STATE,
  init: () => {},
  setMode: (mode: Mode) => {},
  setRpc: (rpc: string) => {},
  setEtherscan: (etherscan: string) => {},
})

export function useAppContext() {
  return useContext(Context)
}

function saveToLocalStorage(state: State) {
  const { mode, rpc, etherscan }: LocalStorageData = state

  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        mode,
        rpc,
        etherscan,
      }),
    )
  } catch (error) {
    console.log("Save local storage error:", error)
  }
}

function getFromLocalStorage(): Partial<LocalStorageData> {
  let data: Partial<LocalStorageData> = {}

  try {
    const { mode, rpc, etherscan } =
      JSON.parse(localStorage.getItem(KEY) || "") || {}
    data = {
      mode: mode ?? STATE.mode,
      rpc: rpc ?? "",
      etherscan: etherscan ?? "",
    }
  } catch (error) {
    console.log("Get local storage error:", error)
  }

  return data
}

export const Provider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(reducer, STATE)

  const init = () => {
    if (state.initialized) {
      return
    }
    const data: Partial<LocalStorageData> = getFromLocalStorage()
    dispatch({
      type: "INIT",
      mode: (data?.mode || STATE.mode) as Mode,
    })
  }

  const setMode = (mode: Mode) => {
    // NOTE: also update index.html
    if (mode == "dark") {
      document.body.classList.remove("light")
      document.body.classList.add("dark")
    } else {
      document.body.classList.remove("dark")
      document.body.classList.add("light")
    }

    dispatch({ type: "SET_MODE", mode })

    saveToLocalStorage({
      ...state,
      mode,
    })
  }

  const setRpc = (rpc: string) => {
    dispatch({ type: "SET_RPC", rpc })
  }

  const setEtherscan = (etherscan: string) => {
    dispatch({ type: "SET_ETHERSCAN", etherscan })
  }

  const value = useMemo(
    () => ({
      state,
      init,
      setMode,
      setRpc,
      setEtherscan,
    }),
    [state],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}
