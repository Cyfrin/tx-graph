import React from "react"
import styles from "./Evm.module.css"

const Evm: React.FC<{ ctx: { val?: bigint } }> = ({ ctx }) => {
  if (!ctx.val) {
    return null
  }

  return (
    <div className={styles.ctx}>
      <div>{"{"}</div>
      <div className={styles.label}>value: </div>
      <div className={styles.val}>{(ctx.val || 0).toString()}</div>
      <div>{"}"}</div>
    </div>
  )
}

export default Evm
