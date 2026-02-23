import React from "react"
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter"
import { atomDark as theme } from "react-syntax-highlighter/dist/esm/styles/prism"

const CodeViewer: React.FC<{
  text: string
}> = ({ text }) => {
  return (
    <SyntaxHighlighter language="solidity" style={theme} showLineNumbers>
      {text}
    </SyntaxHighlighter>
  )
}

export default CodeViewer
