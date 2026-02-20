export const SECTORS = [
  1000, 50, 100, 150, 200, 250, 300, 50, 100, 150, 200, 250, 300, 50, 100, 150,
  200, 250, 300, 50, 100, 150, 200, 250, 300, 50, 100, 150, 200, 250, 300
]

export const getColor = (value, index) => {
  if (value === 1000) return '#1b8f3a'
  return index % 2 === 0 ? '#111111' : '#c62828'
}
