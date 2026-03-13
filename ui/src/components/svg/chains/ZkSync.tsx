import React from "react"

const ZkSync: React.FC<{
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21.0002 12.0004L15.8943 7.50244V10.7982L10.8242 14.0961L15.8943 14.0982V16.5002L21.0002 12.0004Z"
        fill="black"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 11.9997L8.10583 16.4997V13.2372L13.1404 9.93723L8.10821 9.9352V7.49982L3 11.9997Z"
        fill="black"
      />
    </svg>
  )
}

export default ZkSync
