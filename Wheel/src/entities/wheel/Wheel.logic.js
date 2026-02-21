export const getTargetRotation = (
  winnerIndex,
  totalSectors,
  currentRotation
) => {
  const angleStep = 360 / totalSectors

  const winnerCenterAngle = winnerIndex * angleStep + angleStep / 2

  const desiredEndRotation = -winnerCenterAngle

  const fullSpins = 5 + Math.floor(Math.random() * 3)

  const norm = (((desiredEndRotation - currentRotation) % 360) + 360) % 360
  const targetRotation = currentRotation + fullSpins * 360 + norm

  return { targetRotation, fullSpins }
}
