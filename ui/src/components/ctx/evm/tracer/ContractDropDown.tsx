import React from "react"
import CopyText from "../../../CopyText"
import styles from "./ContractDropDown.module.css"

const ContractDropDown: React.FC<{ ctx: { dst: string } }> = ({ ctx }) => {
  return (
    <div className={styles.ctx}>
      <div className={styles.label}>address: </div>
      <div className={styles.val}>
        <CopyText text={ctx.dst} />
      </div>
    </div>
  )
}

export default ContractDropDown
