import React from "react"
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter"
import solidity from "react-syntax-highlighter/dist/esm/languages/prism/solidity"
import { atomDark as theme } from "react-syntax-highlighter/dist/esm/styles/prism"

// Register to ship with production code
SyntaxHighlighter.registerLanguage("solidity", solidity)

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
