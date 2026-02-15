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
  // tag => files
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
      const snapshot: Map<string, Map<string, FileTypes.File>> = new Map()

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

        for (const p of added) {
          const f = snapshot.get(tag)?.get(p)
          if (f) {
            await f.handle.text()
          }
        }
      }

      let changed = false
      if (changed) {
      }

      // if changed
      //    update tags => file path (remove delete files + add added files)
      //    update file path => content
    }, 3000)

    return () => {
      clearInterval(id)
    }
    // TODO: state.version?
  }, [state])

  function get(tag: string): FileTypes.File[] {
    return Object.values(state.files[tag] || {})
  }

  function set(tag: string, files: FileTypes.File[]) {
    setState((state) => ({
      ...state,
      files: {
        ...state.files,
        [tag]: files.reduce(
          (z, f) => {
            z[f.path] = f
            return z
          },
          {} as Record<string, FileTypes.File>,
        ),
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

    const files = { ...state.files }
    delete files[tag]

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
