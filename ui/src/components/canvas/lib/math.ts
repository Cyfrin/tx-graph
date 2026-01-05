import { Point } from "./types"

// Linear equation y = dx / dx * x + y0
export function lin(dy: number, dx: number, x: number, y0: number): number {
  return (dy / dx) * x + y0
}

export function dist(p0: Point, p1: Point): number {
  const dx = p0.x - p1.x
  const dy = p0.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
}

// Calculates total distance between points
export function len(points: Point[]): [number, number[]] {
  const segs: number[] = []
  let l = 0
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]
    const p1 = points[i + 1]
    const d = dist(p0, p1)
    segs.push(d)
    l += d
  }

  return [l, segs]
}

// Linear interpolation
export function lerp(a: number, b: number, t: number): number {
  return a * (1 - t) + t * b
}

// Polyline interpolation
export function perp(points: Point[], t: number): Point {
  const [l, segs] = len(points)

  const d = t * l
  let a = 0
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i]
    if (d < a + s) {
      const u = (d - a) / s
      const p0 = points[i]
      const p1 = points[i + 1]
      return {
        x: lerp(p0.x, p1.x, u),
        y: lerp(p0.y, p1.y, u),
      }
    }
    a += s
  }

  const last = points[points.length - 1]
  return {
    x: last.x,
    y: last.y,
  }
}

// Samples f(i) for i in 0 to n
export function sample<A>(n: number, f: (i: number) => A): A[] {
  const data = new Array<A>(n + 1)
  for (let i = 0; i <= n; i++) {
    data[i] = f(i)
  }
  return data
}
