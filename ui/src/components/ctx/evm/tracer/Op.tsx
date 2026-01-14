import React from "react"
import { CallType } from "../types"
import styles from "./Op.module.css"

const Op: React.FC<{ ctx: { type?: CallType } }> = ({ ctx }) => {
  const style = styles[`label-${ctx?.type}`] || ""
  if (!ctx?.type) {
    console.warn(`Unknown call type ${ctx?.type}`)
  }
  return (
    <div className={styles.component}>
      <span className={`${styles.label} ${style}`}>{ctx?.type}</span>
    </div>
  )
}

export default Op
