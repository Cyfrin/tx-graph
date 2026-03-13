import React from "react"
import styles from "./Gas.module.css"

function fmt(gas: bigint): string {
  const n = Number(gas)
  if (n < 10_000_000) {
    return n.toLocaleString()
  }
  return n.toExponential(2)
}

// Gradient from gray to orange based on gas
function color(gas: bigint): string {
  const t = Math.min(Number(gas) / 2_000_000, 1)
  // Interpolate: gray (102,102,102) → orange-500 (249,115,22)
  const r = Math.round(102 + t * 147)
  const g = Math.round(102 + t * 13)
  const b = Math.round(102 - t * 80)
  return `rgb(${r}, ${g}, ${b})`
}

const Gas: React.FC<{ ctx: { gas?: bigint } }> = ({ ctx }) => {
  return (
    <div
      className={styles.component}
      style={ctx.gas != null ? { color: color(ctx.gas) } : undefined}
    >
      {ctx.gas != null ? fmt(ctx.gas) : ""}
    </div>
  )
}

export default Gas
