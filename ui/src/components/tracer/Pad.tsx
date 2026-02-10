import React from "react"

const Pad: React.FC<{ depth: number; height: number }> = ({
  depth,
  height,
}) => {
  if (depth > 0) {
    // 10px per depth: 9px padding + 1px line
    const width = depth * 10

    return (
      <div>
        <svg width={width} height={height} style={{ display: "block" }}>
          {Array.from({ length: depth }, (_, i) => (
            <g key={i}>
              {/* Vertical line offset by 9px to the right */}
              <line
                x1={i * 10 + 9}
                y1={0}
                x2={i * 10 + 9}
                y2={height}
                stroke="grey"
                strokeWidth={1}
              />
            </g>
          ))}
        </svg>
      </div>
    )
  }
  return null
}

export default Pad
