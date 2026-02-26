import React, { useEffect, useState, useRef } from "react"
import * as api from "../../../../api"
import useAsync from "../../../../hooks/useAsync"
import CopyText from "../../../CopyText"
import Copy from "../../../svg/Copy"
import Check from "../../../svg/Check"
import FullScreen from "../../../svg/FullScreen"
import FullScreenExit from "../../../svg/FullScreenExit"
import Chevron from "../../../svg/Chevron"
import Button from "../../../Button"
import CodeViewer from "../../../CodeViewer"
import styles from "./ContractModal.module.css"

const ContractModal: React.FC<{
  ctx: { name?: string; dst: string }
  chain: string
}> = ({ ctx, chain }) => {
  const getContract = useAsync(api.getContract)
  const [fullScreen, setFullScreen] = useState(false)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
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

  const toggle = (i: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(i)) {
        next.delete(i)
      } else {
        next.add(i)
      }
      return next
    })
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
              <div className={styles.codeHeader} onClick={() => toggle(i)}>
                <Chevron
                  size={14}
                  className={`${styles.chevron} ${expanded.has(i) ? styles.chevronOpen : ""}`}
                />
                <div className={styles.codeName}>{k}</div>
              </div>
              {expanded.has(i) ? (
                <>
                  <div className={styles.tools}>
                    <Button
                      className={styles.copyBtn}
                      onClick={() => copy(v, i)}
                    >
                      {copiedIndex == i ? (
                        <Check size={16} />
                      ) : (
                        <Copy size={16} />
                      )}
                    </Button>
                    <Button
                      className={styles.fullScreenBtn}
                      onClick={() => setFullScreen(!fullScreen)}
                    >
                      {fullScreen ? (
                        <FullScreenExit size={16} />
                      ) : (
                        <FullScreen size={16} />
                      )}
                    </Button>
                  </div>
                  <div
                    className={styles.code}
                    style={{ maxHeight: fullScreen ? "100%" : 300 }}
                  >
                    <CodeViewer text={v} />
                  </div>
                </>
              ) : null}
            </div>
          ))
        : null}
    </div>
  )
}

export default ContractModal
