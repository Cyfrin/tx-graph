import React from "react"

const Unichain: React.FC<{
  size: number
  color?: string
  className?: string
  onClick?: (e: React.MouseEvent) => void
}> = ({ size, className = "", onClick }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      className={className}
      onClick={onClick}
    >
      <path
        d="M21 11.8288C16.1217 11.8288 12.1713 7.87433 12.1713 3H11.8287V11.8288H3V12.1712C7.87832 12.1712 11.8287 16.1257 11.8287 21H12.1713V12.1712H21V11.8288Z"
        fill="#F50DB4"
      />
    </svg>
  )
}

export default Unichain
