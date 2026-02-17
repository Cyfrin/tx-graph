import React from "react"

const XMark: React.FC<{
  size: number
  color?: string
  className?: string
  onClick?: () => void
}> = ({ size, color = "currentColor", className = "", onClick }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={3}
      stroke={color}
      width={size}
      height={size}
      className={className}
      onClick={onClick}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  )
}

export default XMark
