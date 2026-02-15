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
  get: (tag: string) => {},
  set: (tag: string, files: FileTypes.File[]) => {},
  watch: (
    tag: string,
    handle: FileSystemDirectoryHandle | FileSystemFileHandle,
  ) => {},
  unwatch: (tag: string) => {},
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

async function snap(
  handles: Map<string, FileSystemDirectoryHandle | FileSystemFileHandle>,
): Promise<Map<string, Map<string, FileHandle>>> {
  // tag => path => file
  const snapshot: Map<string, Map<string, FileHandle>> = new Map()

  await Promise.all(
    [...handles.entries()].map(async ([tag, handle]) => {
      try {
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
      } catch (err) {
        console.log(err)
      }
    }),
  )

  return snapshot
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
      const snapshot = await snap(state.handles)

      // Compare snapshots
      for (const [tag, files] of state.files.entries()) {
        const sub = snapshot.get(tag)
        if (!sub) {
          continue
        }

        // Diff
        const curr = new Set(sub.keys())
        const prev = new Set(files.keys())
        const added = new Set([...curr].filter((x) => !prev.has(x)))
        const removed = new Set([...prev].filter((x) => !curr.has(x)))
        const updated = new Set(
          [...files.values()].filter((f) => {
            const next = sub.get(f.path)
            if (next) {
              return next.size != f.size || next.lastModified != f.lastModified
            }
            return false
          }),
        )

        if (added.size > 0 || removed.size > 0 || updated.size > 0) {
          const data: Map<string, FileTypes.File> = new Map(files)

          const changed = new Set(...added, ...updated)
          await Promise.all(
            [...changed].map(async (p) => {
              const f = sub.get(p)
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
            }),
          )

          for (const p of removed) {
            data.delete(p)
          }

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
