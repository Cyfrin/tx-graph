import React, { useEffect, useState, useRef } from "react"
import * as api from "../../../../api"
import useAsync from "../../../../hooks/useAsync"
import CopyText from "../../../CopyText"
import Copy from "../../../svg/Copy"
import Check from "../../../svg/Check"
import Button from "../../../Button"
import CodeViewer from "../../../CodeViewer"
import styles from "./ContractModal.module.css"

const ContractModal: React.FC<{
  ctx: { name?: string; dst: string }
  chain: string
}> = ({ ctx, chain }) => {
  const getContract = useAsync(api.getContract)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    if (ctx.dst && chain && chain != "foundry-test") {
      getContract.exec({ addr: ctx.dst, chain })
    }
    return () => {
      if (timer.current) {
        clearTimeout(timer.current)
      }
    }
  }, [])

  const copy = (val: string, i: number) => {
    navigator.clipboard.writeText(val)

    setCopiedIndex(i)
    if (timer.current) {
      clearTimeout(timer.current)
    }
    timer.current = setTimeout(() => setCopiedIndex(null), 1500)
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
        ? entries.map(([, v], i) => (
            <div className={styles.col} key={i}>
              <div className={styles.tools}>
                <Button className={styles.copyBtn} onClick={() => copy(v, i)}>
                  {copiedIndex == i ? <Check size={16} /> : <Copy size={16} />}
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
