import { gsap } from 'gsap'

export const spinWheel = (sectorsRef, rotation, onComplete) => {
  if (!sectorsRef.current) return

  gsap.killTweensOf(sectorsRef.current)

  // Основное вращение
  gsap.to(sectorsRef.current, {
    rotation: rotation,
    duration: 5,
    ease: 'power4.out',
    transformOrigin: '50% 50%',
    onComplete: () => {
      gsap.to(sectorsRef.current, {
        rotation: rotation + 4,
        duration: 0.6,
        ease: 'back.out(1.5)',
        onComplete
      })
    }
  })
}
