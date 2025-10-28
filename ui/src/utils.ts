export function zip<A, B, C>(a: A[], b: B[], f: (a: A, b: B) => C): C[] {
  const n = Math.min(a.length, b.length)
  const c: C[] = []

  for (let i = 0; i < n; i++) {
    c.push(f(a[i], b[i]))
  }

  return c
}

export function bound(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max)
}

export function assert(b: boolean, msg: string) {
  if (!b) {
    throw new Error(msg)
  }
}

export function clip(s: string, max: number, half: number = 10): string {
  if (s.length <= max) {
    return s
  }
  return `${s.slice(0, half)}...${s.slice(-half)}`
}

export function fmt(addr: string): string {
  return `${addr.slice(0, 5)}...${addr.slice(-3)}`
}
