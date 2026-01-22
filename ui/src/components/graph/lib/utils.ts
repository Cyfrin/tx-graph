export function assert(b: boolean, msg: string) {
  if (!b) {
    throw new Error(msg)
  }
}
