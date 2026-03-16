import React from "react"
import { CallType } from "../types"
import styles from "./Op.module.css"

const SHORT_TEXT: Record<string, string> = {
  call: "c",
  staticcall: "s",
  delegatecall: "d",
  event: "e",
  selfdestruct: "s",
  create: "c",
  create2: "c",
}

const Op: React.FC<{ ctx: { type?: CallType }; short?: boolean }> = ({
  ctx,
  short,
}) => {
  const style = styles[`label-${ctx?.type}`] || ""
  if (!ctx?.type) {
    console.warn(`Unknown call type ${ctx?.type}`)
  }
  const label = short ? SHORT_TEXT[ctx?.type || ""] || ctx?.type : ctx?.type
  return (
    <div className={short ? styles.short : styles.component}>
      <span className={`${styles.label} ${style}`}>{label}</span>
    </div>
  )
}

export default Op
