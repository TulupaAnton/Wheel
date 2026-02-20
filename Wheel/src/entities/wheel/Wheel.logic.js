export const getTargetRotation = (
  winnerIndex,
  totalSectors,
  currentRotation
) => {
  const angleStep = 360 / totalSectors

  const targetAngle = winnerIndex * angleStep + angleStep / 2

  const extraSpins = 6 * 360

  return currentRotation + extraSpins - targetAngle
}
