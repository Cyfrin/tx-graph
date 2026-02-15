export type File = {
  name: string
  path: string
  data: Object
  size: number
  lastModified: number
}

// In memory file storage
export type MemStore = {
  get(tag: string): File[]
}
