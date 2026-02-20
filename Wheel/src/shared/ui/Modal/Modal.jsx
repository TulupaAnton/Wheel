import React, { useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import styles from './Modal.module.css'

export function WinModal ({ isOpen, prize, onClose }) {
  const overlayRef = useRef(null)
  const modalRef = useRef(null)
  const prizeRef = useRef(null)
  const canvasRef = useRef(null)
  const titleRef = useRef(null)
  const ctaRef = useRef(null)
  const animationRef = useRef()

  const createConfetti = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const colors = [
      '#ff6a00',
      '#ffae00',
      '#ff4500',
      '#ffd700',
      '#ffffff',
      '#ff8c00',
      '#ffa500'
    ]
    const particles = []

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: 4 + Math.random() * 8,
        speedX: (Math.random() - 0.5) * 2,
        speedY: 3 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        opacity: 0.8 + Math.random() * 0.2,
        width: 4 + Math.random() * 8,
        height: 2 + Math.random() * 6
      })
    }

    return particles
  }, [])

  const animateConfetti = useCallback((particles, ctx, canvas) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    particles.forEach(p => {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)

      ctx.globalAlpha = p.opacity
      ctx.fillStyle = p.color

      if (p.size > 7) {
        ctx.beginPath()
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height)
      }

      ctx.restore()

      p.x += p.speedX
      p.y += p.speedY
      p.rotation += p.rotationSpeed
      p.opacity -= 0.002
      p.speedY += 0.03

      if (p.opacity <= 0.1 || p.y > canvas.height + 50) {
        p.x = Math.random() * canvas.width
        p.y = -20 - Math.random() * 50
        p.speedY = 2 + Math.random() * 5
        p.speedX = (Math.random() - 0.5) * 2
        p.opacity = 0.8 + Math.random() * 0.2
        p.rotation = Math.random() * 360
      }
    })

    animationRef.current = requestAnimationFrame(() =>
      animateConfetti(particles, ctx, canvas)
    )
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const ctx = canvasRef.current?.getContext('2d')
    const canvas = canvasRef.current
    const particles = createConfetti()

    const tl = gsap.timeline()

    tl.fromTo(
      overlayRef.current,
      { opacity: 0, backdropFilter: 'blur(0px)' },
      {
        opacity: 1,
        backdropFilter: 'blur(8px)',
        duration: 0.5,
        ease: 'power2.inOut'
      }
    )

    tl.fromTo(
      modalRef.current,
      { scale: 0.3, opacity: 0, y: 50 },
      {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'elastic.out(1, 0.5)'
      },
      '-=0.3'
    )

    tl.fromTo(
      titleRef.current,
      { scale: 2, opacity: 0, rotation: -10 },
      {
        scale: 1,
        opacity: 1,
        rotation: 0,
        duration: 0.6,
        ease: 'back.out(1.7)'
      },
      '-=0.4'
    )

    tl.fromTo(
      prizeRef.current,
      {
        scale: 0.2,
        opacity: 0,
        innerText: 0
      },
      {
        scale: 1.3,
        opacity: 1,
        innerText: prize,
        duration: 1.5,
        ease: 'power4.out',
        snap: { innerText: 1 }
      },
      '-=0.2'
    )

    tl.to(prizeRef.current, {
      scale: 1,
      duration: 0.4,
      ease: 'elastic.out(1, 0.3)'
    })

    tl.fromTo(
      ctaRef.current,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(2)' },
      '-=0.2'
    )

    if (canvas && ctx) {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      animateConfetti(particles, ctx, canvas)
    }

    const handleResize = () => {
      if (canvas) {
        canvas.width = canvas.offsetWidth
        canvas.height = canvas.offsetHeight
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener('resize', handleResize)
    }
  }, [isOpen, prize, createConfetti, animateConfetti])

  if (!isOpen) return null

  return (
    <div ref={overlayRef} className={styles.overlay}>
      <div ref={modalRef} className={styles.modal}>
        <canvas ref={canvasRef} className={styles.confettiCanvas}></canvas>

        {/* Декоративные элементы */}
        <div className={styles.glowOrbs}>
          <div className={styles.orb1}></div>
          <div className={styles.orb2}></div>
        </div>

        <button className={styles.close} onClick={onClose}>
          <span>×</span>
        </button>

        <h2 ref={titleRef} className={styles.title}>
          <span className={styles.titleGlow}>JACKPOT!</span>
        </h2>

        <div className={styles.prizeWrapper}>
          <div className={styles.prizeLabel}>YOU WON</div>
          <div className={styles.prize}>
            <span ref={prizeRef} className={styles.prizeValue}>
              0
            </span>{' '}
            <span className={styles.prizeCurrency}>coins</span>
          </div>
        </div>

        <button ref={ctaRef} className={styles.cta}>
          <span className={styles.ctaText}>CLAIM BONUS</span>
          <span className={styles.ctaGlow}></span>
        </button>
      </div>
    </div>
  )
}
