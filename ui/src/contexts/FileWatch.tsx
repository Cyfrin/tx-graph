import React, {
  useState,
  createContext,
  useContext,
  useMemo,
  useEffect,
} from "react"
import * as FileTypes from "../types/file"

export type State = {
  // TODO: remove tag?
  // tag => file paths
  tags: Record<string, string[]>
  // file path => file
  files: Record<string, FileTypes.File>
  // tag => file handle
  handles: Record<string, FileSystemDirectoryHandle | FileSystemFileHandle>
}

const STATE: State = {
  tags: {},
  files: {},
  handles: {},
}

const Context = createContext({
  state: STATE,
  get: (_tag: string) => {},
  set: (_tag: string, _files: FileTypes.File[]) => {},
  watch: (
    _tag: string,
    _handle: FileSystemDirectoryHandle | FileSystemFileHandle,
  ) => {},
  reset: () => {},
})

export function useFileWatchContext() {
  return useContext(Context)
}

async function walk(handle: FileSystemDirectoryHandle): Promise<
  {
    path: string
    lastModified: number
    size: number
    handle: FileSystemFileHandle
  }[]
> {
  // BFS
  const q: {
    path: string
    handle: FileSystemDirectoryHandle | FileSystemFileHandle
  }[] = [{ path: "", handle }]
  const handles = []
  const visited = new Set()

  let i = 0
  while (i < q.length) {
    const { path, handle } = q[i++]

    if (visited.has(path)) {
      continue
    }
    visited.add(path)

    if (handle.kind == "file") {
      handles.push({ path, handle })
    } else if (handle.kind == "directory") {
      // @ts-ignore
      for await (const [name, h] of handle) {
        q.push({
          path: path ? `${path}/${name}` : name,
          handle: h,
        })
      }
    }
  }

  const files = await Promise.all(
    handles.map(async ({ path, handle }) => {
      const file = await handle.getFile()
      return {
        path,
        lastModified: file.lastModified,
        size: file.size,
        handle,
      }
    }),
  )

  return files
}

export const Provider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<State>({
    tags: {},
    files: {},
    handles: {},
  })

  useEffect(() => {
    const entries = Object.entries(state.handles)
    if (entries.length == 0) {
      return
    }

    const id = setInterval(async () => {
      const files = []
      await Promise.all(
        entries.map(async ([tag, handle]) => {
          if (handle.kind == "file") {
            const file = await handle.getFile()
            files.push({
              // TODO: path?
              path: file.name,
              lastModified: file.lastModified,
              size: file.size,
              handle,
            })
          } else if (handle.kind == "directory") {
            files.push(...(await walk(handle)))
          }
        }),
      )
      // compare snapshots
      // if changed
      //    update tags => file path (remove delete files + add added files)
      //    update file path => content
    }, 3000)

    return () => {
      clearInterval(id)
    }
  }, [state])

  function get(tag: string): FileTypes.File[] {
    return (state.tags[tag] || []).map((path) => state.files[path])
  }

  function set(tag: string, files: FileTypes.File[]) {
    setState((state) => ({
      ...state,
      tags: {
        ...state.tags,
        [tag]: files.map((f) => f.path),
      },
      files: {
        ...state.files,
        ...files.reduce((z: Record<string, FileTypes.File>, f) => {
          z[f.path] = f
          return z
        }, {}),
      },
    }))
  }

  function watch(
    tag: string,
    handle: FileSystemDirectoryHandle | FileSystemFileHandle,
  ) {
    setState((state) => ({
      ...state,
      handles: { ...state.handles, [tag]: handle },
    }))
  }

  function unwatch(tag: string) {
    const handles = { ...state.handles }
    delete handles[tag]

    setState((state) => ({
      ...state,
      handles,
    }))
  }

  function reset() {
    setState(STATE)
  }

  const value = useMemo(
    () => ({
      state,
      get,
      set,
      watch,
      unwatch,
      reset,
    }),
    [state],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}
