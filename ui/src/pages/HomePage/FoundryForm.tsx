import * as FileTypes from "../../types/file"
import Button from "../../components/Button"
import styles from "./FoundryForm.module.css"

const FILE_SYS_ACCESS = !!(
  // @ts-ignore
  (window?.showDirectoryPicker && window?.showOpenFilePicker)
)

// TODO: filewatch context
const FoundryForm: React.FC<{
  setTraceFile: (file: FileTypes.File) => void
  setABIFiles: (files: FileTypes.File[]) => void
  abis: FileTypes.File[]
}> = ({ setTraceFile, setABIFiles, abis }) => {
  const selectTraceFile = async () => {
    try {
      // @ts-ignore
      const [handle]: FileSystemFileHandle[] = await window.showOpenFilePicker()
      const file = await handle.getFile()
      const contents = await file.text()

      console.log(file.name)
      console.log(contents)
    } catch (err) {
      console.log(err)
    }
  }

  const selectAbiFiles = async () => {
    try {
      const handle: FileSystemDirectoryHandle =
        // @ts-ignore
        await window.showDirectoryPicker()
      console.log(handle)
    } catch (err) {
      console.log(err)
    }
  }

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target

    if (files) {
      const vals: FileTypes.File[] = []
      for (const file of files) {
        try {
          const text = await file.text()
          const json = JSON.parse(text)

          vals.push({
            name: file.name,
            path: file.webkitRelativePath,
            data: json,
            lastModified: file.lastModified,
            size: file.size,
          })
        } catch (error) {
          // TODO: toast
          alert(`Failed to parse JSON: ${file.name}`)
          break
        }
      }

      if (vals.length == files.length) {
        if (name == "trace") {
          setTraceFile(vals[0])
        } else {
          setABIFiles(vals)
        }
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
          <Button onClick={selectTraceFile}>Choose File</Button>
        ) : (
          <input type="file" name="trace" onChange={onChange} />
        )}
      </div>
      <div className={styles.input}>
        <div>2. Upload ABI files</div>
        {FILE_SYS_ACCESS ? (
          <Button onClick={selectAbiFiles}>Choose File</Button>
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
      <ul style={{ maxHeight: 300, overflowY: "auto" }}>
        {abis.map((file, i) => (
          <li key={i}>{file.path}</li>
        ))}
      </ul>
    </div>
  )
}

export default FoundryForm
