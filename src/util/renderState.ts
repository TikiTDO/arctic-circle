import { Direction } from "../CircleState"

const renderState = (
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  stepSize: number,
  vertexX: number,
  vertexY: number,
  from: number,
): void => {
  // Never have a zero step size, because the image disappears
  if (stepSize <= 0) stepSize = 1

  const targetCanvasVertexX = originX + vertexX * stepSize
  const targetCanvasVertexY = originY + vertexY * stepSize

  const drawArrow = stepSize > 10

  // The actual box
  switch (from) {
    case Direction.E:
      ctx.fillStyle = "#8c1212"
      ctx.fillRect(targetCanvasVertexX, targetCanvasVertexY - stepSize, stepSize, 2 * stepSize) // Box

      if (drawArrow) {
        const arrowTipX = targetCanvasVertexX + (stepSize * 1) / 3
        const arrowTipY = targetCanvasVertexY

        ctx.beginPath()
        ctx.moveTo(targetCanvasVertexX + (stepSize * 2) / 3, targetCanvasVertexY) // Arrow Body
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.moveTo(targetCanvasVertexX + stepSize / 2, targetCanvasVertexY + stepSize / 6) // Arrow Head 1
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.moveTo(targetCanvasVertexX + stepSize / 2, targetCanvasVertexY - stepSize / 6) // Arrow Head 2
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.stroke()
      }

      break

    case Direction.N:
      ctx.fillStyle = "#1a1ad5"
      ctx.fillRect(
        targetCanvasVertexX - stepSize,
        targetCanvasVertexY - stepSize,
        2 * stepSize,
        stepSize,
      ) // Box

      if (drawArrow) {
        const arrowTipX = targetCanvasVertexX
        const arrowTipY = targetCanvasVertexY - (stepSize * 1) / 3

        ctx.beginPath()
        ctx.moveTo(targetCanvasVertexX, targetCanvasVertexY - (stepSize * 2) / 3) // Arrow Body
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.moveTo(targetCanvasVertexX - stepSize / 6, targetCanvasVertexY - stepSize / 2) // Arrow Head 1
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.moveTo(targetCanvasVertexX + stepSize / 6, targetCanvasVertexY - stepSize / 2) // Arrow Head 2
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.stroke()
      }

      break
    case Direction.S:
      ctx.fillStyle = "#17cb17"
      ctx.fillRect(targetCanvasVertexX - stepSize, targetCanvasVertexY, 2 * stepSize, stepSize) // Box

      if (drawArrow) {
        const arrowTipX = targetCanvasVertexX
        const arrowTipY = targetCanvasVertexY + (stepSize * 1) / 3

        ctx.beginPath()
        ctx.moveTo(targetCanvasVertexX, targetCanvasVertexY + (stepSize * 2) / 3) // Arrow Body
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.moveTo(targetCanvasVertexX + stepSize / 6, targetCanvasVertexY + stepSize / 2) // Arrow Head 1
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.moveTo(targetCanvasVertexX - stepSize / 6, targetCanvasVertexY + stepSize / 2) // Arrow Head 2
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.stroke()
      }
      break
    case Direction.W:
      ctx.fillStyle = "#caca6e"
      ctx.fillRect(
        targetCanvasVertexX - stepSize,
        targetCanvasVertexY - stepSize,
        stepSize,
        2 * stepSize,
      ) // Box

      if (drawArrow) {
        const arrowTipX = targetCanvasVertexX - (stepSize * 1) / 3
        const arrowTipY = targetCanvasVertexY

        ctx.beginPath()
        ctx.moveTo(targetCanvasVertexX - (stepSize * 2) / 3, targetCanvasVertexY) // Arrow Body
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.moveTo(targetCanvasVertexX - stepSize / 2, targetCanvasVertexY - stepSize / 6) // Arrow Head 1
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.moveTo(targetCanvasVertexX - stepSize / 2, targetCanvasVertexY + stepSize / 6) // Arrow Head 2
        ctx.lineTo(arrowTipX, arrowTipY)
        ctx.stroke()
      }

      break
  }

  // Target Vertex (Optional)
  if (drawArrow) {
    ctx.strokeRect(targetCanvasVertexX - 1, targetCanvasVertexY - 1, 2, 2)
  }
}

export default renderState
