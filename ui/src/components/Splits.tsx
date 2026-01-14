import React, { useEffect, useRef } from "react"
import { useWindowSizeContext } from "../contexts/WindowSize"
import useSplits from "../hooks/useSplits"
import styles from "./Splits.module.css"

export const SPLIT_HEIGHT = 8

type DragRef = {
  x0: number
  y0: number
  split: number
}

const Overlay: React.FC<{}> = () => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      zIndex: 999,
    }}
  />
)

const Splits: React.FC<{
  children: ((
    rect: {
      top: number
      left: number
      width: number
      height: number
    },
    dragging: boolean,
  ) => React.ReactNode)[]
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
        // top height = 3 / 8 window height
        split: (windowSize.height >> 3) * 3,
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
    splits.stop()
  }

  const onPointerLeave = (_: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    drag.current = null
    splits.stop()
  }

  return (
    <div
      className={styles.component}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
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
        {children[0](
          {
            top: splits.state.root.top,
            left: splits.state.root.left,
            width: splits.state.root.width,
            height: splits.state.split - (SPLIT_HEIGHT >> 1),
          },
          splits.state.dragging,
        )}
        {splits.state.dragging ? <Overlay /> : null}
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
        {children[1](
          {
            top:
              splits.state.root.top + splits.state.split + (SPLIT_HEIGHT >> 1),
            left: splits.state.root.left,
            width: splits.state.root.width,
            height: splits.state.root.height - splits.state.split,
          },
          splits.state.dragging,
        )}
        {splits.state.dragging ? <Overlay /> : null}
      </div>
    </div>
  )
}

export default Splits
