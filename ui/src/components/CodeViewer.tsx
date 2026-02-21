import React from "react"
import styles from "./CodeViewer.module.css"

const CodeViewer: React.FC<{
  text: string
}> = ({ text }) => {
  return <div className={styles.component}>{text}</div>
}

export default CodeViewer
