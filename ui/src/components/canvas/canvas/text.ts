import { CanvasContext, Text } from "./types"

export function draw(ctx: CanvasContext, params: Partial<Text>) {
  const {
    left = 0,
    top = 0,
    color = "black",
    font = "12px Arial",
    text = "",
  } = params

  ctx.textBaseline = "top"
  ctx.textAlign = "left"

  ctx.font = font
  ctx.fillStyle = color

  ctx.fillText(`${text}`, left, top)
}
