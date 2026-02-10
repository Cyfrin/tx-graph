import React from "react"
import Chevron from "../svg/Chevron"
import styles from "./Fold.module.css"

const Fold: React.FC<{
  show: boolean
  hasChildren: boolean
  onClick: () => void
}> = ({ show, hasChildren, onClick }) => {
  return (
    <div className={styles.component}>
      {hasChildren ? (
        <Chevron
          size={19}
          className={show ? styles.chevronDown : styles.chevronRight}
          onClick={onClick}
        />
      ) : null}
    </div>
  )
}

export default Fold
