import React from "react"
import CopyText from "../../../CopyText"
import { CallType } from "../types"
import Op from "./Op"
import styles from "./FnDropDown.module.css"

// TODO: fix highlights

const FnDropDown: React.FC<{
  ctx: {
    type: CallType
    selector?: string
    raw?: { input?: string; output?: string }
  }
}> = ({ ctx }) => {
  return (
    <div className={styles.component}>
      <div className={styles.row}>
        <div className={styles.label}>type: </div>
        <div className={styles.val}>
          <Op ctx={ctx} />
        </div>
      </div>
      {ctx.selector ? (
        <div className={styles.row}>
          <div className={styles.label}>selector: </div>
          <div className={styles.val}>
            <CopyText text={ctx.selector} val={ctx.selector} />
          </div>
        </div>
      ) : null}
      {ctx.raw?.input ? (
        <div className={styles.row}>
          <div className={styles.label}>input: </div>
          <div className={styles.val}>
            <CopyText text={ctx.raw.input} max={100} val={ctx.raw.input} />
          </div>
        </div>
      ) : null}
      {ctx.raw?.output ? (
        <div className={styles.row}>
          <div className={styles.label}>output: </div>
          <div className={styles.val}>
            <CopyText text={ctx.raw.output} max={100} val={ctx.raw.output} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default FnDropDown
