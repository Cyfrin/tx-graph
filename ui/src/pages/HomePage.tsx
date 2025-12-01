import { useState } from "react"
import { useNavigate } from "react-router-dom"
import styles from "./HomePage.module.css"
import { RPC_CONFIG, RpcConfig } from "../config"

export function HomePage() {
  const navigate = useNavigate()
  const [inputs, setInputs] = useState({
    chain: "eth-mainnet",
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

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const txHash = inputs.txHash.trim()
    if (txHash != "") {
      navigate(`/tx/${inputs.txHash}?chain=${inputs.chain}`)
    }
  }

  return (
    <div className={styles.component}>
      <form onSubmit={(e) => onSubmit(e)} className={styles.form}>
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
        <input
          className={styles.input}
          type="text"
          value={inputs.txHash}
          onChange={(e) => setTxHash(e.target.value)}
          placeholder="tx hash"
          autoFocus
        />
      </form>
    </div>
  )
}

export default HomePage
