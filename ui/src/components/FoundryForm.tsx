import { useState, useEffect, useRef } from "react"
import * as FileTypes from "../types/file"
import styles from "./FoundryForm.module.css"

async function getFileSnapshots(
  dirHandle: FileSystemDirectoryHandle,
  path = "",
): Promise<
  Map<
    string,
    { handle: FileSystemFileHandle; lastModified: number; size: number }
  >
> {
  const snapshots = new Map()
  for await (const [name, handle] of dirHandle as any) {
    const fullPath = path ? `${path}/${name}` : name
    if (handle.kind === "file") {
      const file = await handle.getFile()
      snapshots.set(fullPath, {
        handle,
        lastModified: file.lastModified,
        size: file.size,
      })
    } else {
      const sub = await getFileSnapshots(handle, fullPath)
      for (const [k, v] of sub) snapshots.set(k, v)
    }
  }
  return snapshots
}

async function readJsonFiles(
  dirHandle: FileSystemDirectoryHandle,
  path = "",
): Promise<FileTypes.File[]> {
  const files: FileTypes.File[] = []
  for await (const [name, handle] of dirHandle as any) {
    const fullPath = path ? `${path}/${name}` : name
    if (handle.kind === "file") {
      try {
        const file = await handle.getFile()
        const text = await file.text()
        const json = JSON.parse(text)
        files.push({ name: file.name, path: fullPath, data: json })
      } catch {
        // skip non-JSON files
      }
    } else {
      const sub = await readJsonFiles(handle, fullPath)
      files.push(...sub)
    }
  }
  return files
}

const FoundryForm: React.FC<{
  setTraceFile: (file: FileTypes.File) => void
  setABIFiles: (files: FileTypes.File[]) => void
  abis: FileTypes.File[]
}> = ({ setTraceFile, setABIFiles, abis }) => {
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(
    null,
  )
  const prevSnapshot = useRef<
    Map<string, { lastModified: number; size: number }>
  >(new Map())

  const onTraceChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      setTraceFile({ name: file.name, path: file.name, data: json })
    } catch {
      alert(`Failed to parse JSON: ${file.name}`)
    }
  }

  const pickABIDir = async () => {
    try {
      // @ts-ignore
      const handle = await window.showDirectoryPicker()
      setDirHandle(handle)
      const files = await readJsonFiles(handle)
      setABIFiles(files)
      prevSnapshot.current = await getFileSnapshots(handle)
    } catch (e: any) {
      if (e.name !== "AbortError") {
        alert(`Error: ${e.message}`)
      }
    }
  }

  // Poll for file changes
  useEffect(() => {
    if (!dirHandle) return

    const id = setInterval(async () => {
      try {
        const curr = await getFileSnapshots(dirHandle)
        const prev = prevSnapshot.current
        let changed = false

        for (const [path, info] of curr) {
          const old = prev.get(path)
          if (
            !old ||
            old.lastModified !== info.lastModified ||
            old.size !== info.size
          ) {
            changed = true
            break
          }
        }
        if (!changed) {
          for (const path of prev.keys()) {
            if (!curr.has(path)) {
              changed = true
              break
            }
          }
        }

        if (changed) {
          const files = await readJsonFiles(dirHandle)
          setABIFiles(files)
          prevSnapshot.current = curr
        }
      } catch (e) {
        console.error("Poll error:", e)
      }
    }, 2000)

    return () => clearInterval(id)
  }, [dirHandle, setABIFiles])

  return (
    <div>
      <div className={styles.input}>
        <div>1. Upload output of test trace</div>
        <div className={styles.wrap}>
          <div className={styles.shell}>
            <span style={{ color: "orange" }}>forge</span>
            <span style={{ color: "lightblue" }}> test </span>
            {`--match-path test/MyTest.t.sol -vvvv --json > out.json`}
          </div>
        </div>
        <input type="file" name="trace" onChange={onTraceChange} />
      </div>
      <div className={styles.input}>
        <div>
          2. Select ABI directory
          {dirHandle && (
            <span style={{ color: "green" }}>
              {" "}
              — watching {dirHandle.name}/
            </span>
          )}
        </div>
        <button onClick={pickABIDir}>
          {dirHandle ? "Change directory" : "Select ABI Folder"}
        </button>
      </div>
      <ul style={{ maxHeight: 300, overflowY: "auto" }}>
        {abis.map((file, i) => (
          <li key={i}>{file.path}</li>
        ))}
      </ul>
    </div>
  )
}

export default FoundryForm
