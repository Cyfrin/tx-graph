import React, {
  useState,
  createContext,
  useContext,
  useMemo,
  useEffect,
} from "react"
import * as FileTypes from "../types/file"

export type FileHandle = {
  path: string
  lastModified: number
  size: number
  handle: FileSystemFileHandle
}

export type State = {
  // tag => path => file
  files: Map<string, Map<string, FileTypes.File>>
  // tag => file handle
  handles: Map<string, FileSystemDirectoryHandle | FileSystemFileHandle>
}

const STATE: State = {
  files: new Map(),
  handles: new Map(),
}

const Context = createContext({
  state: STATE,
  get: (_tag: string) => {},
  set: (_tag: string, _files: FileTypes.File[]) => {},
  watch: (
    _tag: string,
    _handle: FileSystemDirectoryHandle | FileSystemFileHandle,
  ) => {},
  unwatch: (_tag: string) => {},
  reset: () => {},
})

export function useFileWatchContext() {
  return useContext(Context)
}

async function walk(handle: FileSystemDirectoryHandle): Promise<FileHandle[]> {
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
    files: new Map(),
    handles: new Map(),
  })

  useEffect(() => {
    if (Object.keys(state.handles).length == 0) {
      return
    }

    const id = setInterval(async () => {
      // tag => path => file
      const snapshot: Map<string, Map<string, FileHandle>> = new Map()

      await Promise.all(
        [...state.handles.entries()].map(async ([tag, handle]) => {
          if (handle.kind == "file") {
            const file = await handle.getFile()

            const map = new Map()
            map.set(file.name, {
              // TODO: path?
              path: file.name,
              lastModified: file.lastModified,
              size: file.size,
              handle,
            })

            snapshot.set(tag, map)
          } else if (handle.kind == "directory") {
            const files = await walk(handle)

            const map = new Map()
            for (const f of files) {
              map.set(f.path, f)
            }

            snapshot.set(tag, map)
          }
        }),
      )

      // Compare snapshots
      for (const [tag, files] of state.files.entries()) {
        const snap = new Set(snapshot.get(tag)?.keys() || [])
        const curr = new Set([...files.values()].map((f) => f.path))
        const added = new Set([...curr].filter((x) => !snap.has(x)))
        const removed = new Set([...snap].filter((x) => !curr.has(x)))
        const updated = new Set(
          [...files.values()].filter((f) => {
            const next = snapshot.get(tag)?.get(f.path)
            if (next) {
              return next.size != f.size || next.lastModified != f.lastModified
            }
            return false
          }),
        )

        const data: Map<string, FileTypes.File> = new Map(state.files.get(tag))

        // TODO: clean up + parallel read
        const changed = new Set(...added, ...updated)
        for (const p of changed) {
          const f = snapshot.get(tag)?.get(p)
          if (f) {
            try {
              const file = await f.handle.getFile()
              const txt = await file.text()
              const json = JSON.parse(txt)
              data.set(f.path, {
                name: file.name,
                path: f.path,
                data: json,
                size: file.size,
                lastModified: file.lastModified,
              })
            } catch (error) {
              console.log(error)
            }
          }
        }

        for (const p of removed) {
          data.delete(p)
        }

        if (data.size > 0) {
          setState((state) => ({
            ...state,
            files: {
              ...state.files,
              [tag]: data,
            },
          }))
        }
      }
    }, 3000)

    return () => {
      clearInterval(id)
    }
    // TODO: state.version?
  }, [state])

  function get(tag: string): FileTypes.File[] {
    return [...(state.files.get(tag)?.values() || [])]
  }

  function set(tag: string, files: FileTypes.File[]) {
    const map = new Map()
    for (const f of files) {
      map.set(f.path, f)
    }

    const updates: Map<string, Map<string, FileTypes.File>> = new Map(
      state.files,
    )
    updates.set(tag, map)

    setState((state) => ({
      ...state,
      files: updates,
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
    const handles = new Map(state.handles)
    handles.delete(tag)

    const files = new Map(state.files)
    files.delete(tag)

    setState((state) => ({
      ...state,
      files,
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
