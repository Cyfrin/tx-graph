import React from "react"
import styles from "./Evm.module.css"

// TODO: CSS for dark and light mode
const Evm: React.FC<{ ctx: { value?: bigint } }> = ({ ctx }) => {
  if (!ctx.value) {
    return null
  }

  return (
    <div className={styles.ctx}>
      <div>{"{"}</div>
      <div className={styles.label}>value: </div>
      <div className={styles.value}>{(ctx.value || 0).toString()}</div>
      <div>{"}"}</div>
    </div>
  )
}

export default Evm
