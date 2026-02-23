import React from "react"
import CopyText from "../../../CopyText"
import styles from "./ContractModal.module.css"

const ContractModal: React.FC<{ ctx: { dst: string } }> = ({ ctx }) => {
  return (
    <div className={styles.ctx}>
      <div className={styles.label}>address: </div>
      <div className={styles.val}>
        <CopyText text={ctx.dst} val={ctx.dst} />
      </div>
    </div>
  )
}

export default ContractModal
