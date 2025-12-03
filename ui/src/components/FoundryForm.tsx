import styles from "./HomePage.module.css"

import { File } from "../types/file"

const FoundryForm: React.FC<{
  setTraceFile: (file: File) => void
  setABIFiles: (files: File[]) => void
  abis: File[]
}> = ({ setTraceFile, setABIFiles, abis }) => {
  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target

    if (files) {
      const vals: File[] = []
      for (const file of files) {
        try {
          const text = await file.text()
          const json = JSON.parse(text)

          vals.push({
            name: file.name,
            path: file.webkitRelativePath,
            data: json,
          })
        } catch (error) {
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
      <div>Trace JSON file</div>
      <input type="file" name="trace" onChange={onChange} />
      <div>ABI files</div>
      <input
        type="file"
        name="abi"
        // @ts-ignore
        webkitdirectory=""
        multiple
        onChange={onChange}
      />
      <ul style={{ maxHeight: 300, overflowY: "auto" }}>
        {abis.map((file, i) => (
          <li key={i}>{file.path}</li>
        ))}
      </ul>
    </div>
  )
}

export default FoundryForm
