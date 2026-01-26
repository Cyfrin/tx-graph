import React from "react"
import CopyText from "../CopyText"
import { Input } from "./types"
import styles from "./Inputs.module.css"

const Inputs: React.FC<{
  inputs: Input[]
  getLabel?: (val: string) => string | null
}> = ({ inputs, getLabel }) => {
  const len = inputs.length
  return (
    <div className={styles.component}>
      {inputs.map((input, i) => (
        <div key={i} className={styles.input}>
          {!!input.name ? (
            <>
              <span className={styles.name}>{input.name}</span>
              <span className={styles.eq}>=</span>
            </>
          ) : null}
          <span className={styles.val}>
            <CopyText text={input.val.toString()} val={input.val.toString()} />
          </span>
          {i < len - 1 ? <span className={styles.comma}>,</span> : null}
        </div>
      ))}
    </div>
  )
}

export default Inputs
