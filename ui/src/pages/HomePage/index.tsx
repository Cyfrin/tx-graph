import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { RPC_CONFIG, RpcConfig } from "../../config"
import { useAppContext } from "../../contexts/App"
import { useFileWatchContext } from "../../contexts/FileWatch"
import Button from "../../components/Button"
import FoundryForm from "./FoundryForm"
import styles from "./index.module.css"

export function HomePage() {
  const navigate = useNavigate()
  const app = useAppContext()
  const fileWatch = useFileWatchContext()

  const [inputs, setInputs] = useState({
    // chain: "eth-mainnet",
    // TODO:switch back to eth-mainnet
    chain: "foundry-test",
    txHash: "",
    rpc: app.state.rpc,
    etherscan: app.state.etherscan,
  })

  useEffect(() => {
    fileWatch.reset()
  }, [inputs.chain])

  const setInput = (key: string, val: string) => {
    setInputs({
      ...inputs,
      [key]: val,
    })
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (inputs.chain == "foundry-test") {
      const trace = fileWatch.get("trace")?.[0] || null
      if (trace != null) {
        // Need none empty tx hash for /tx to render
        navigate(`/tx/0x00?chain=foundry-test`)
      }
    } else {
      const txHash = inputs.txHash.trim()
      if (txHash != "") {
        const rpc = inputs.rpc.trim()
        const etherscan = inputs.etherscan.trim()

        if (rpc) {
          app.setRpc(rpc)
        }
        if (etherscan) {
          app.setEtherscan(etherscan)
        }

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
              onChange={(e) => setInput("chain", e.target.value)}
            >
              <optgroup label="mainnet">
                {Object.entries(RPC_CONFIG)
                  .filter(([_, cfg]) => !cfg.test)
                  .map(([key, cfg]: [string, RpcConfig]) => (
                    <option key={key} value={key}>
                      {cfg.text}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="test">
                {Object.entries(RPC_CONFIG)
                  .filter(([_, cfg]) => cfg.test)
                  .map(([key, cfg]: [string, RpcConfig]) => (
                    <option key={key} value={key}>
                      {cfg.text}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {inputs.chain == "foundry-test" ? (
            <div className={styles.foundrySection}>
              <FoundryForm />
              <Button type="submit" className={styles.submit}>
                explore
              </Button>
            </div>
          ) : (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>transaction hash</label>
                <div className={styles.inputWrapper}>
                  <input
                    className={styles.input}
                    type="text"
                    value={inputs.txHash}
                    onChange={(e) => setInput("txHash", e.target.value)}
                    placeholder="0x..."
                    autoFocus
                  />
                  <Button type="submit">explore</Button>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>rpc url (optional)</label>
                <input
                  className={styles.input}
                  type="text"
                  value={inputs.rpc}
                  onChange={(e) => setInput("rpc", e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  etherscan api key (optional)
                </label>
                <input
                  className={styles.input}
                  type="text"
                  value={inputs.etherscan}
                  onChange={(e) => setInput("etherscan", e.target.value)}
                  placeholder="API key"
                />
              </div>
            </>
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
