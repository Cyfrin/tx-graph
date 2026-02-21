import React, { useEffect } from "react"
import * as api from "../../../../api"
import CopyText from "../../../CopyText"
import useAsync from "../../../../hooks/useAsync"
import styles from "./ContractDropDown.module.css"

const ContractDropDown: React.FC<{ ctx: { dst: string }; chain: string }> = ({
  ctx,
  chain,
}) => {
  const getContract = useAsync(api.getContract)

  useEffect(() => {
    if (chain != "foundry-test") {
      // getContract.exec({ chain, addr: ctx.dst })
    }
  }, [])

  console.log("GET", getContract)

  // TODO: code viewer

  return (
    <div className={styles.ctx}>
      <div className={styles.label}>address: </div>
      <div className={styles.val}>
        <CopyText text={ctx.dst} val={ctx.dst} />
      </div>
    </div>
  )
}

export default ContractDropDown
