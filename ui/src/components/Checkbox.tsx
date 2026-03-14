import React from "react"
import styles from "./Checkbox.module.css"

const Checkbox: React.FC<{
  checked: boolean
  onChange: () => void
  children?: React.ReactNode
  className?: string
}> = ({ checked, onChange, children, className = "" }) => {
  return (
    <div className={styles.component}>
      <input
        type="checkbox"
        onChange={onChange}
        checked={checked}
        className={`${styles.input} ${className}`}
      />
      {children ? children : null}
    </div>
  )
}

export default Checkbox
