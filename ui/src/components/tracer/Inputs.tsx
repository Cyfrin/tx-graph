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
      {inputs.map((input, i) => {
        const val = input.val.toString()
        const label = getLabel ? getLabel(val) || val : val
        return (
          <div key={i} className={styles.input}>
            {!!input.name ? (
              <>
                <span className={styles.name}>{input.name}</span>
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

export default Inputs
