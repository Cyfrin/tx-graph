import * as FileTypes from "../../types/file"
import { useFileWatchContext } from "../../contexts/FileWatch"
import Button from "../../components/Button"
import Spinner from "../../components/svg/Spinner"
import styles from "./FoundryForm.module.css"

const FILE_SYS_ACCESS = !!(
  // @ts-ignore
  (window?.showDirectoryPicker && window?.showOpenFilePicker)
)
const FoundryForm: React.FC<{}> = ({}) => {
  const fileWatch = useFileWatchContext()
  const abis = fileWatch.get("abi")
  const trace = fileWatch.get("trace")?.[0]

  const selectTraceFile = async () => {
    try {
      // @ts-ignore
      const [handle]: FileSystemFileHandle[] = await window.showOpenFilePicker()
      fileWatch.watch("trace", handle)
    } catch (err) {
      // TODO: toast
      console.log(err)
    }
  }

  const selectAbiFiles = async () => {
    try {
      // @ts-ignore
      fileWatch.watch("abi", await window.showDirectoryPicker())
    } catch (err) {
      // TODO: toast
      console.log(err)
    }
  }

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target

    if (files) {
      const vals: FileTypes.File[] = []
      try {
        for (const file of files) {
          const text = await file.text()
          const json = JSON.parse(text)

          vals.push({
            name: file.name,
            path: file.webkitRelativePath,
            data: json,
            lastModified: file.lastModified,
            size: file.size,
          })
        }
      } catch (err) {
        // TODO: toast
        alert(`Failed to parse JSON: ${err}`)
      }

      if (
        (name == "trace" && vals.length == 1) ||
        (name == "abi" && vals.length > 0)
      ) {
        fileWatch.set(name, vals)
      }
    }
  }

  return (
    <div>
      <div className={styles.input}>
        <div>1. Upload output of test trace</div>
        <div className={styles.wrap}>
          <div className={styles.shell}>
            <span style={{ color: "orange" }}>forge</span>
            <span style={{ color: "lightblue" }}> test </span>
            {`--match-path test/MyTest.t.sol -vvvv --json > out.json`}
          </div>
        </div>
        {FILE_SYS_ACCESS ? (
          <div className={styles.watch}>
            <Button onClick={selectTraceFile}>Choose File</Button>
            <div className={styles.status}>
              <Spinner size={16} className={styles.spinner} />
              {trace ? `watching ${trace.name}` : ""}
            </div>
          </div>
        ) : (
          <input type="file" name="trace" onChange={onChange} />
        )}
      </div>
      <div className={styles.input}>
        <div>2. Upload ABI files</div>
        {FILE_SYS_ACCESS ? (
          <div className={styles.watch}>
            <Button onClick={selectAbiFiles}>Choose File</Button>
            <div className={styles.status}>
              <Spinner size={16} className={styles.spinner} />
              {abis.length > 0 ? `watching ${abis.length} files` : ""}
            </div>
          </div>
        ) : (
          <input
            type="file"
            name="abi"
            // @ts-ignore
            webkitdirectory=""
            multiple
            onChange={onChange}
          />
        )}
      </div>
      <ul className={styles.abiList}>
        {abis.map((file, i) => (
          <li key={i}>{file.path}</li>
        ))}
      </ul>
    </div>
  )
}

export default FoundryForm
