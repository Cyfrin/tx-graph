import { Box } from "./types"

export function findNearestIndex<A>(
  arr: A[],
  get: (a: A) => number,
  x: number,
): number {
  let low = 0
  let high = arr.length - 1

  if (arr.length <= 1) {
    return high
  }

  if (get(arr[low]) > get(arr[high])) {
    throw new Error("data not sorted")
  }

  // Binary search
  while (low < high) {
    let mid = ((low + high) / 2) >> 0

    if (get(arr[mid]) > x) {
      high = mid
    } else {
      low = mid + 1
    }
  }

  return low
}

export function isInside(
  box: Box,
  point: { x: number | undefined; y: number | undefined },
): boolean {
  const { x, y } = point

  if (!x || x < box.left || x > box.left + box.width) {
    return false
  }
  if (!y || y < box.top || y > box.top + box.height) {
    return false
  }

  return true
}

export function bound(x: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, x))
}

export function stepBelow(x: number, step: number): number {
  return x - (x % step)
}

export function lerp(p0: number, p1: number, t: number): number {
  // 0 <= t <= 1
  return p0 * (1 - t) + p1 * t
}

export function lin(dy: number, dx: number, x: number, y0: number): number {
  return (dy / dx) * x + y0
}

export function getCanvasX(
  width: number,
  left: number,
  xMax: number,
  xMin: number,
  x: number,
): number {
  const dx = xMax - xMin
  return lin(width, dx, x, left - (width * xMin) / dx)
}

export function getCanvasY(
  height: number,
  top: number,
  yMax: number,
  yMin: number,
  y: number,
): number {
  const dy = yMax - yMin
  return lin(-height, dy, y, top + (height * yMax) / dy)
}

export function getX(
  width: number,
  left: number,
  xMax: number,
  xMin: number,
  canvasX: number,
): number {
  const dx = xMax - xMin
  return lin(dx, width, canvasX, xMin - (dx / width) * left)
}

export function getY(
  height: number,
  top: number,
  yMax: number,
  yMin: number,
  canvasY: number,
): number {
  const dy = yMax - yMin
  return lin(-dy, height, canvasY, yMax + (dy / height) * top)
}
