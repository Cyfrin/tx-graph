import React, { useState } from "react"

type Props = {
  len: number
  lineHeight: number
  height: number
  overscan?: number
  render: (idx: number) => React.ReactNode
}

export default function VirtualList({
  len,
  lineHeight,
  height,
  overscan = 5,
  render,
}: Props) {
  const [scrollTop, setScrollTop] = useState(0)

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  const totalHeight = len * lineHeight
  const startIndex = Math.max(0, Math.floor(scrollTop / lineHeight) - overscan)
  const endIndex = Math.min(
    len - 1,
    Math.ceil((scrollTop + height) / lineHeight) + overscan,
  )

  const items = []
  for (let i = startIndex; i <= endIndex; i++) {
    items.push(
      <div
        key={i}
        style={{
          position: "absolute",
          top: i * lineHeight,
          height: lineHeight,
          width: "100%",
        }}
      >
        {render(i)}
      </div>,
    )
  }

  return (
    <div
      onScroll={onScroll}
      style={{
        position: "relative",
        height,
        overflowY: "auto",
        willChange: "transform",
      }}
    >
      <div
        style={{
          position: "relative",
          height: totalHeight,
        }}
      >
        {items}
      </div>
    </div>
  )
}
