import React from "react"
import Copy from "./svg/Copy"
import { clip } from "../utils"
import styles from "./CopyText.module.css"

const CopyText: React.FC<{
  text: string
  val: string
  max?: number
}> = ({ text, val, max }) => {
  const copy = () => {
    navigator.clipboard.writeText(val)
  }

  return (
    <div className={styles.component}>
      <div className={styles.copy}>{max ? clip(text, max) : text}</div>
      <Copy size={16} className={styles.icon} onClick={copy} />
    </div>
  )
}

export default CopyText
