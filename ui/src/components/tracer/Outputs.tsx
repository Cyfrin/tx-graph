import React from "react"
import CopyText from "../CopyText"
import { Output } from "./types"
import styles from "./Outputs.module.css"

const Outputs: React.FC<{
  outputs: Output[]
  getLabel?: (val: string) => string | null
}> = ({ outputs, getLabel }) => {
  const len = outputs.length
  return (
    <div className={styles.component}>
      {outputs.map((output, i) => {
        const val = output.val.toString()
        const label = getLabel ? getLabel(val) || val : val
        return (
          <div key={i} className={styles.output}>
            {output.name ? (
              <>
                <span className={styles.name}>{output.name}</span>
                <span className={styles.eq}>=</span>
              </>
            ) : null}
            <span className={styles.val}>
              <CopyText text={label} val={val} max={100} />
            </span>
            {i < len - 1 ? <span className={styles.comma}>,</span> : null}
          </div>
        )
      })}
    </div>
  )
}

export default Outputs
