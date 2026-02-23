import React from "react"
import styles from "./Button.module.css"

const Button: React.FC<{
  type?: "button" | "submit"
  onClick?: () => void
  children?: React.ReactNode
  disabled?: boolean
  className?: string
}> = ({
  type = "button",
  disabled = false,
  onClick,
  children,
  className = styles.btn,
}) => {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`${styles.component} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export default Button
