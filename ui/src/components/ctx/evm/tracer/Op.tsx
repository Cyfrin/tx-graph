import React from "react"
import { CallType } from "../types"
import styles from "./Op.module.css"

const Op: React.FC<{ ctx: { type?: CallType } }> = ({ ctx }) => {
  const style = styles[`label-${ctx?.type}`] || ""
  return <span className={`${styles.label} ${style}`}>{ctx.type}</span>
}

export default Op
