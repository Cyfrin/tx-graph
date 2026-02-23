import React, { useEffect } from "react"
import * as api from "../../../../api"
import useAsync from "../../../../hooks/useAsync"
import CopyText from "../../../CopyText"
import Copy from "../../../svg/Copy"
import Button from "../../../Button"
import CodeViewer from "../../../CodeViewer"
import styles from "./ContractModal.module.css"

const ContractModal: React.FC<{
  ctx: { name?: string; dst: string }
  chain: string
}> = ({ ctx, chain }) => {
  const getContract = useAsync(api.getContract)

  useEffect(() => {
    if (ctx.dst && chain && chain != "foundry-test") {
      getContract.exec({ addr: ctx.dst, chain })
    }
  }, [])

  const copy = (val: string) => {
    navigator.clipboard.writeText(val)
  }

  const entries = Object.entries(getContract.data?.src || {})

  return (
    <div className={styles.component}>
      {ctx.name ? <div className={styles.row}>{ctx.name}</div> : null}
      <div className={styles.row}>
        <div className={styles.label}>address: </div>
        <div className={styles.val}>
          <CopyText text={ctx.dst} val={ctx.dst} />
        </div>
      </div>
      {entries.length > 0
        ? entries.map(([k, v], i) => (
            <div className={styles.col} key={i}>
              <div className={styles.tools}>
                <Button className={styles.copyBtn} onClick={() => copy(v)}>
                  <Copy size={16} />
                </Button>
              </div>
              <div className={styles.code} style={{ maxHeight: 300 }}>
                <CodeViewer text={v} />
              </div>
            </div>
          ))
        : null}
    </div>
  )
}

export default ContractModal
