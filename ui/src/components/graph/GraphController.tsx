import React from "react"
import styles from "./GraphController.module.css"

export const GraphController: React.FC<{
  zoomPercentage: number
  onClickPlus: () => void
  onClickMinus: () => void
  color?: string
  backgroundColor?: string
}> = ({ zoomPercentage, onClickPlus, onClickMinus }) => {
  return (
    <div className={styles.component}>
      <button className={styles.buttonLeft} onClick={onClickMinus}>
        -
      </button>
      <div className={styles.level}>{Math.round(zoomPercentage)}%</div>
      <button className={styles.buttonRight} onClick={onClickPlus}>
        +
      </button>
    </div>
  )
}
