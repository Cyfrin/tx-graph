import * as FileTypes from "./types/file"

type State = {
  files: Record<string, FileTypes.File[]>
}

const STATE: State = {
  files: {},
}

export function get(key: string): FileTypes.File[] | null {
  return STATE.files[key] || null
}

export function set(key: string, files: FileTypes.File[]) {
  STATE.files = {
    ...STATE.files,
    [key]: files,
  }
}
