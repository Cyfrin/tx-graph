import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { RPC_CONFIG, RpcConfig } from "../config"
import * as FileStorage from "../files"
import FoundryForm from "../components/FoundryForm"
import * as FileTypes from "../types/file"
import styles from "./HomePage.module.css"

export function HomePage() {
  const navigate = useNavigate()

  const [inputs, setInputs] = useState({
    chain: "eth-mainnet",
    // chain: "foundry-test",
    txHash: "",
  })
  const [fs, setFiles] = useState<Record<string, FileTypes.File[]>>({})

  const set = (key: string, files: FileTypes.File[]) => {
    setFiles({
      ...fs,
      [key]: files,
    })
    FileStorage.set(key, files)
  }

  const get = (key: string) => {
    return fs[key] || null
  }

  const setChain = (chain: string) => {
    setInputs({
      ...inputs,
      chain,
    })
  }

  const setTxHash = (txHash: string) => {
    setInputs({
      ...inputs,
      txHash,
    })
  }

  const setTraceFile = (file: FileTypes.File) => {
    set("trace", [file])
  }

  const setABIFiles = (files: FileTypes.File[]) => {
    set("abi", files)
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (inputs.chain == "foundry-test") {
      const trace = get("trace")?.[0] || null
      if (trace != null) {
        // Need none empty tx hash for /tx to render
        navigate(`/tx/0x00?chain=foundry-test`)
      }
    } else {
      const txHash = inputs.txHash.trim()
      if (txHash != "") {
        navigate(`/tx/${inputs.txHash}?chain=${inputs.chain}`)
      }
    }
  }

  return (
    <div className={styles.component}>
      <div className={styles.container}>
        <form onSubmit={onSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>network</label>
            <select
              className={styles.select}
              value={inputs.chain}
              onChange={(e) => setChain(e.target.value)}
            >
              {Object.entries(RPC_CONFIG).map(
                ([key, cfg]: [string, RpcConfig]) => (
                  <option key={key} value={key}>
                    {cfg.text}
                  </option>
                ),
              )}
            </select>
          </div>

          {inputs.chain == "foundry-test" ? (
            <div className={styles.foundrySection}>
              <FoundryForm
                setTraceFile={setTraceFile}
                setABIFiles={setABIFiles}
                abis={get("abi") || []}
              />
              <button type="submit" className={styles.button}>
                Explore Transaction
              </button>
            </div>
          ) : (
            <div className={styles.formGroup}>
              <label className={styles.label}>transaction hash</label>
              <div className={styles.inputWrapper}>
                <input
                  className={styles.input}
                  type="text"
                  value={inputs.txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="0x..."
                  autoFocus
                />
                <button type="submit" className={styles.button}>
                  explore
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      <a
        className={styles.footer}
        href="https://github.com/Cyfrin/tx-graph"
        target="_blank"
      >
        GitHub
      </a>
    </div>
  )
}

export default HomePage
