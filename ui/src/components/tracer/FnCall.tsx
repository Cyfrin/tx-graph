import React from "react"
import { Input, Output } from "./types"
import styles from "./FnCall.module.css"

const FnCall: React.FC<{
  name: string
  val: number | BigInt
  inputs: Input[]
  outputs: Output[]
}> = ({ name, val, inputs, outputs }) => {
  const v = BigInt(val.toString())
  return (
    <div className={styles.component}>
      <div>
        <span className={styles.fn}>{name}</span>
        {v > 0n ? (
          <>
            <span>{"{"}</span>
            <span className={styles.label}>value: </span>
            <span className={styles.send}>{v.toString()}</span>
            <span>{"}"}</span>
          </>
        ) : null}
        <span>(</span>
        {inputs.map((v, i) => (
          <React.Fragment key={i}>
            {!!v.name ? (
              <>
                <span className={styles.name}>{v.name}</span>
                <span className={styles.eq}>=</span>
              </>
            ) : null}
            <span className={styles.val}>{v.val.toString()}</span>
            {i < inputs.length - 1 ? <span>, </span> : null}
          </React.Fragment>
        ))}
        <span>)</span>
        {outputs.length > 0 ? (
          <>
            <span> {`→`} </span>
            <span>(</span>
            {outputs.map((v, i) => (
              <React.Fragment key={i}>
                {!!v.name ? (
                  <>
                    <span className={styles.name}>{v.name}</span>
                    <span className={styles.eq}>=</span>
                  </>
                ) : null}
                <span className={styles.val}>{v.val.toString()}</span>
                {i < outputs.length - 1 ? <span>, </span> : null}
              </React.Fragment>
            ))}
            <span>)</span>
          </>
        ) : null}
      </div>
    </div>
  )
}

export default FnCall
