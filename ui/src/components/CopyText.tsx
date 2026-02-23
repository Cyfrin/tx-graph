import React, { useEffect, useState, useRef } from "react"
import Copy from "./svg/Copy"
import Check from "./svg/Check"
import { clip } from "../utils"
import styles from "./CopyText.module.css"

const CopyText: React.FC<{
  text: string
  val: string
  max?: number
}> = ({ text, val, max }) => {
  const [copied, setCopied] = useState<boolean>(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current)
      }
    }
  }, [])

  const copy = () => {
    navigator.clipboard.writeText(val)

    setCopied(true)
    if (timer.current) {
      clearTimeout(timer.current)
    }
    timer.current = setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={styles.component} onClick={copy}>
      <div className={styles.copy}>{max ? clip(text, max) : text}</div>
      {copied ? (
        <Check size={24} className={styles.icon} />
      ) : (
        <Copy size={24} className={styles.icon} />
      )}
    </div>
  )
}

export default CopyText
