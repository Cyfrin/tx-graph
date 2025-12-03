import React, { useMemo, useState, createContext, useContext } from "react"
import { File } from "../types/file"

// In memory file storage used for visualizing user uploaded transaction
// such as Foundry test

type State = {
  files: Record<string, File[]>
}

type Ctx = {
  state: State
  set: (key: string, files: File[]) => void
  get: (key: string) => File[] | null
}

const STATE: State = {
  files: {},
}

const FileStorageContext = createContext<Ctx>({
  state: STATE,
  set: (key: string, files: File[]) => {},
  get: (key: string) => null,
})

export function useFileStorageContext() {
  return useContext(FileStorageContext)
}

export const Provider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<State>(STATE)

  const set = (key: string, files: File[]) => {
    setState({
      ...state,
      files: {
        ...state.files,
        [key]: files,
      },
    })
  }

  const get = (key: string) => {
    return state.files[key] || null
  }

  const val = useMemo(
    () => ({
      state,
      set,
      get,
    }),
    [state],
  )

  return (
    <FileStorageContext.Provider value={val}>
      {children}
    </FileStorageContext.Provider>
  )
}
