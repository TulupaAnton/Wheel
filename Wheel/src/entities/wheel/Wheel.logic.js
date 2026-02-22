export const getTargetRotation = (
  winnerIndex,
  totalSectors,
  currentRotation
) => {
  const angleStep = 360 / totalSectors

  const winnerCenterAngle = winnerIndex * angleStep + angleStep / 2

  const desiredEndRotation = -winnerCenterAngle

  // Уменьшаем количество оборотов для мобильных устройств
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
  const minSpins = isMobile ? 4 : 5
  const maxSpins = isMobile ? 6 : 7
  const fullSpins = minSpins + Math.floor(Math.random() * (maxSpins - minSpins))

  const norm = (((desiredEndRotation - currentRotation) % 360) + 360) % 360
  const targetRotation = currentRotation + fullSpins * 360 + norm

  return { targetRotation, fullSpins }
}
