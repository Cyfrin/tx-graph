import React, { useEffect, useRef } from "react"
import { useWindowSizeContext } from "../contexts/WindowSize"
import { bound } from "../utils"
import useSplits from "../hooks/useSplits"
import styles from "./Splits.module.css"

export const SPLIT_HEIGHT = 8

type DragRef = {
  x0: number
  y0: number
  split: number
}

const Splits: React.FC<{
  children: ((rect: {
    top: number
    left: number
    width: number
    height: number
  }) => React.ReactNode)[]
}> = ({ children }) => {
  const windowSize = useWindowSizeContext()
  const splits = useSplits()
  const drag = useRef<DragRef | null>(null)

  useEffect(() => {
    if (windowSize) {
      splits.init({
        top: 0,
        left: 0,
        width: windowSize.width,
        height: windowSize.height,
        split: windowSize.height >> 2,
      })
    }
  }, [windowSize])

  if (!windowSize || !splits.state) {
    return null
  }

  const onPointerDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (splits.state) {
      drag.current = {
        x0: e.clientX,
        y0: e.clientY,
        split: splits.state.split,
      }
    }
  }

  const onPointerMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!drag.current || !splits.state) {
      return
    }

    const { y0, split } = drag.current

    splits.drag({
      split: split + (e.clientY - y0),
    })
  }

  const onPointerUp = (_: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    drag.current = null
  }

  return (
    <div
      className={styles.component}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
        style={{
          position: "absolute",
          top: splits.state.root.top,
          left: splits.state.root.left,
          width: splits.state.root.width,
          height: splits.state.split - (SPLIT_HEIGHT >> 1),
        }}
      >
        {children[0]({
          top: splits.state.root.top,
          left: splits.state.root.left,
          width: splits.state.root.width,
          height: splits.state.split - (SPLIT_HEIGHT >> 1),
        })}
      </div>
      <div
        className={styles.split}
        style={{
          position: "absolute",
          top: splits.state.root.top + splits.state.split - (SPLIT_HEIGHT >> 1),
          left: splits.state.root.left,
          height: SPLIT_HEIGHT,
          width: splits.state.root.width,
        }}
        onPointerDown={onPointerDown}
      />
      <div
        style={{
          position: "absolute",
          top: splits.state.root.top + splits.state.split + (SPLIT_HEIGHT >> 1),
          left: splits.state.root.left,
          width: splits.state.root.width,
          height: splits.state.root.height - splits.state.split,
        }}
      >
        {children[1]({
          top: splits.state.root.top + splits.state.split + (SPLIT_HEIGHT >> 1),
          left: splits.state.root.left,
          width: splits.state.root.width,
          height: splits.state.root.height - splits.state.split,
        })}
      </div>
    </div>
  )
}

export default Splits
