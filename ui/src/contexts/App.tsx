import React, {
  useReducer,
  createContext,
  useContext,
  useMemo,
  useCallback,
} from "react"
import { Mode } from "../types/app"

// Local storage keys
const KEY = "local"

type LocalStorageData = {
  mode: string
}

type State = {
  initialized: boolean
  mode: Mode
}

interface Init {
  type: "INIT"
  mode: Mode
}

interface SetMode {
  type: "SET_MODE"
  mode: Mode
}

type Action = Init | SetMode

const STATE: State = {
  initialized: false,
  mode: "dark",
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
    default:
      return state
  }
}

const AppContext = createContext({
  state: STATE,
  init: () => {},
  setMode: (mode: Mode) => {},
})

export function useAppContext() {
  return useContext(AppContext)
}

function saveToLocalStorage(state: State) {
  const { mode }: LocalStorageData = state

  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        mode,
      }),
    )
  } catch (error) {
    console.log("Save local storage error:", error)
  }
}

function getFromLocalStorage(): Partial<LocalStorageData> {
  let data: Partial<LocalStorageData> = {}

  try {
    const { mode } = JSON.parse(localStorage.getItem(KEY) || "") || {}
    data = {
      mode: mode ?? STATE.mode,
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

  const init = useCallback(() => {
    if (state.initialized) {
      return
    }
    const data: Partial<LocalStorageData> = getFromLocalStorage()
    dispatch({
      type: "INIT",
      mode: (data?.mode || STATE.mode) as Mode,
    })
  }, [])

  const setMode = useCallback((mode: Mode) => {
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
  }, [])

  const value = useMemo(
    () => ({
      state,
      init,
      setMode,
    }),
    [state],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
