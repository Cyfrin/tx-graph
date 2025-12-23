import React from "react"
import CopyText from "../CopyText"
import { Output } from "./types"
import styles from "./Outputs.module.css"

const Outputs: React.FC<{ outputs: Output[] }> = ({ outputs }) => {
  const len = outputs.length
  return (
    <div className={styles.component}>
      {outputs.map((output, i) => (
        <div key={i} className={styles.output}>
          {output.name ? (
            <>
              <span className={styles.name}>{output.name}</span>
              <span className={styles.eq}>=</span>
            </>
          ) : null}
          <span className={styles.value}>
            <CopyText text={output.value.toString()} />
          </span>
          {i < len - 1 ? <span className={styles.comma}>,</span> : null}
        </div>
      ))}
    </div>
  )
}

export default Outputs
