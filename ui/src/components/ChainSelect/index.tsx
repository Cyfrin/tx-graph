import { useState, useRef, useEffect } from "react"
import { RPC_CONFIG, RpcConfig } from "../../config"
import styles from "./index.module.css"

type Props = {
  value: string
  onChange: (value: string) => void
}

export default function ChainSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const selected = RPC_CONFIG[value as keyof typeof RPC_CONFIG] as
    | RpcConfig
    | undefined

  const mainnet = Object.entries(RPC_CONFIG).filter(([_, cfg]) => !cfg.test)
  const testnet = Object.entries(RPC_CONFIG).filter(([_, cfg]) => cfg.test)

  const renderOption = (key: string, cfg: RpcConfig) => (
    <button
      key={key}
      type="button"
      className={`${styles.option} ${key === value ? styles.optionSelected : ""}`}
      onClick={() => {
        onChange(key)
        setOpen(false)
      }}
    >
      {cfg.icon ? <cfg.icon size={20} /> : <span style={{ width: 20, height: 20, display: "inline-block" }} />}
      <span>{cfg.text}</span>
    </button>
  )

  return (
    <div className={styles.component} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(!open)}
      >
        <span className={styles.triggerContent}>
          {selected?.icon ? <selected.icon size={22} /> : <span style={{ width: 22, height: 22, display: "inline-block" }} />}
          <span>{selected?.text ?? value}</span>
        </span>
        <svg
          className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.groupLabel}>mainnet</div>
          {mainnet.map(([key, cfg]) => renderOption(key, cfg as RpcConfig))}
          <div className={styles.groupLabel}>test</div>
          {testnet.map(([key, cfg]) => renderOption(key, cfg as RpcConfig))}
        </div>
      )}
    </div>
  )
}
