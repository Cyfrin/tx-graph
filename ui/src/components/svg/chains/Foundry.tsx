import React from "react"
import foundryLogo from "../../../static/chains/foundry.png"

const Foundry: React.FC<{
  size: number
  color?: string
  className?: string
  onClick?: (e: React.MouseEvent) => void
}> = ({ size, className = "", onClick }) => {
  return (
    <img
      src={foundryLogo}
      width={size}
      height={size}
      className={className}
      onClick={onClick}
      style={{ borderRadius: "50%" }}
      alt="Foundry"
    />
  )
}

export default Foundry
