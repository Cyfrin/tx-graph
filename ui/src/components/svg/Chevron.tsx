import React from "react"

const Chevron: React.FC<{
  size: number
  className?: string
  onClick?: () => void
}> = ({ size, className = "", onClick }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      width={size}
      height={size}
      className={className}
      onClick={onClick}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 4.5l7.5 7.5-7.5 7.5"
      />
    </svg>
  )
}

export default Chevron
