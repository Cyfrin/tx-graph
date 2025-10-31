import React, { useRef, useState } from "react"
import useOutsideClick from "../../hooks/useOutsideClick"
import styles from "./DropDown.module.css"

const DropDown: React.FC<{
  label: string | number
  highlight: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  children: React.ReactNode
}> = ({ label, highlight, onMouseEnter, onMouseLeave, children }) => {
  const trigger = useRef<HTMLDivElement | null>(null)
  const dropDown = useRef<HTMLDivElement | null>(null)
  const [show, set] = useState(false)

  useOutsideClick(dropDown, (e) => {
    if (show && e.target != trigger.current) {
      set(false)
    }
  })

  const onClick = () => {
    set(!show)
  }

  // TODO: css
  return (
    <div
      className={`${styles.component} ${highlight ? styles.highlight : styles.no_highlight}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span ref={trigger} onClick={onClick}>
        {label}
      </span>
      <div
        ref={dropDown}
        className={`${styles.tooltip} ${show ? styles.show : ""}`}
      >
        {children}
      </div>
    </div>
  )
}

export default DropDown
