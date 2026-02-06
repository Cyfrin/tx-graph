import React from "react"
import styles from "./Button.module.css"

const Button: React.FC<{
  type?: "button" | "submit"
  onClick?: () => void
  children?: React.ReactNode
  disabled?: boolean
}> = ({ type = "button", disabled = false, onClick, children }) => {
  return (
    <button
      type={type}
      disabled={disabled}
      className={styles.component}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export default Button
