import React from "react"

const Spinner: React.FC<{
  size: number
  color?: string
  className?: string
}> = ({ size, color = "#6366f1", className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 50 50"
    style={{ animation: "spin 1s linear infinite" }}
    className={className}
  >
    <circle
      cx="25"
      cy="25"
      r="20"
      fill="none"
      stroke={color}
      strokeWidth="4"
      strokeLinecap="round"
      strokeDasharray="90 150"
      strokeDashoffset="0"
    >
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 25 25"
        to="360 25 25"
        dur="0.8s"
        repeatCount="indefinite"
      />
    </circle>
  </svg>
)

export default Spinner
