import React from "react"

const Check: React.FC<{
  size: number
  color?: string
  className?: string
  onClick?: () => void
}> = ({ size, color = "#00e100", className = "", onClick }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      height={size}
      width={size}
      className={className}
      onClick={onClick}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m4.5 12.75 6 6 9-13.5"
      />
    </svg>
  )
}

export default Check
