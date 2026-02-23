import React from "react"
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import styles from "./CodeViewer.module.css"

const CodeViewer: React.FC<{
  text: string
}> = ({ text }) => {
  return (
    <div className={styles.component}>
      <SyntaxHighlighter
        language="solidity"
        style={vscDarkPlus}
        showLineNumbers
      >
        {text}
      </SyntaxHighlighter>
    </div>
  )
}

export default CodeViewer
