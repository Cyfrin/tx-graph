import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { RPC_CONFIG, RpcConfig } from "../config"
import { useFileStorageContext } from "../contexts/FileStorage"
import FoundryForm from "../components/FoundryForm"
import { File } from "../types/file"
import styles from "./HomePage.module.css"

export function HomePage() {
  const navigate = useNavigate()
  const fileStorage = useFileStorageContext()

  const [inputs, setInputs] = useState({
    // TODO: uncomment
    // chain: "eth-mainnet",
    chain: "foundry-test",
    txHash: "",
  })

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

  const setTraceFile = (file: File) => {
    fileStorage.set("trace", [file])
  }

  const setABIFiles = (files: File[]) => {
    fileStorage.set("abi", files)
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (inputs.chain == "foundry-test") {
      const trace = fileStorage.get("trace")?.[0] || null
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
      <form onSubmit={onSubmit} className={styles.form}>
        <select
          className={styles.select}
          value={inputs.chain}
          onChange={(e) => setChain(e.target.value)}
        >
          {Object.entries(RPC_CONFIG).map(([key, cfg]: [string, RpcConfig]) => (
            <option key={key} value={key}>
              {cfg.text}
            </option>
          ))}
        </select>
        {inputs.chain == "foundry-test" ? (
          <div>
            <FoundryForm
              setTraceFile={setTraceFile}
              setABIFiles={setABIFiles}
              abis={fileStorage.get("abi") || []}
            />
            <button type="submit">Go</button>
          </div>
        ) : (
          <input
            className={styles.input}
            type="text"
            value={inputs.txHash}
            onChange={(e) => setTxHash(e.target.value)}
            placeholder="tx hash"
            autoFocus
          />
        )}
      </form>
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
