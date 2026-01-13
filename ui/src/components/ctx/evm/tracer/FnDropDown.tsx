import React from "react"
import CopyText from "../../../CopyText"
import { clip } from "../../../../utils"
import styles from "./FnDropDown.module.css"

// TODO: fix highlights

const FnDropDown: React.FC<{
  ctx: {
    type: string
    selector?: string
    raw?: { input?: string; output?: string }
  }
}> = ({ ctx }) => {
  return (
    <div className={styles.component}>
      <div className={styles.row}>
        <div className={styles.label}>type: </div>
        <div className={styles.val}>{ctx.type}</div>
      </div>
      {ctx.selector ? (
        <div className={styles.row}>
          <div className={styles.label}>selector: </div>
          <div className={styles.val}>
            <CopyText text={ctx.selector} />
          </div>
        </div>
      ) : null}
      {ctx.raw?.input ? (
        <div className={styles.row}>
          <div className={styles.label}>input: </div>
          <div className={styles.val}>
            <CopyText text={clip(ctx.raw.input, 100)} />
          </div>
        </div>
      ) : null}
      {ctx.raw?.output ? (
        <div className={styles.row}>
          <div className={styles.label}>output: </div>
          <div className={styles.val}>
            <CopyText text={clip(ctx.raw.output, 100)} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default FnDropDown
