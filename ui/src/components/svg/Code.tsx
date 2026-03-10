import React from "react"

const Code: React.FC<{
  size: number
  className?: string
  onClick?: (e: React.MouseEvent) => void
}> = ({ size, className = "", onClick }) => {
  return (

    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      height={size}
      width={size}
      className={className}
      onClick={onClick}
    >
  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
    </svg>
  )
}

export default Code
