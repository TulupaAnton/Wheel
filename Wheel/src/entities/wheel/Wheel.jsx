import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
  memo
} from 'react'
import { SECTORS, getColor } from './Wheel.config'
import { getTargetRotation } from './Wheel.logic'
import { spinWheel } from './Wheel.animation'
import { requestSpinResult } from '../../services/api'

import styles from './Wheel.module.css'

import bgWheel from '../../shared/assets/images/bgWheel.png'
import bgButton from '../../shared/assets/images/bgButton.png'
import smallRim from '../../shared/assets/images/smallRim.png'
import Button from '../../shared/assets/images/Button.png'
import Arrow from '../../shared/assets/images/arrow.png'
import Rim from '../../shared/assets/images/rim.png'
import InnerRim from '../../shared/assets/images/innerRim.png'

const SIZE = 733
const CENTER = SIZE / 2
const OUTER_RADIUS = 350
const INNER_RADIUS = 155

const SPRITE_SIZES = [6, 9, 12, 15, 18]
const SPRITE_COLORS = [
  { r: 255, g: 220, b: 50 },
  { r: 255, g: 140, b: 0 },
  { r: 255, g: 60, b: 0 }
]

function buildSprites () {
  return SPRITE_SIZES.map(sz => {
    return SPRITE_COLORS.map(col => {
      const c = document.createElement('canvas')
      const d = sz * 2 + 2
      c.width = d
      c.height = d
      const ctx = c.getContext('2d')
      const cx = d / 2,
        cy = d / 2
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, sz)
      grd.addColorStop(0, `rgba(${col.r},${col.g},${col.b},1)`)
      grd.addColorStop(0.45, `rgba(${col.r},${Math.max(0, col.g - 40)},0,0.7)`)
      grd.addColorStop(1, `rgba(${Math.max(0, col.r - 40)},0,0,0)`)
      ctx.beginPath()
      ctx.arc(cx, cy, sz, 0, Math.PI * 2)
      ctx.fillStyle = grd
      ctx.fill()
      return c
    })
  })
}

function getDeviceTier () {
  const mem = navigator.deviceMemory || 4
  const cores = navigator.hardwareConcurrency || 4
  const mobile = /Mobi|Android/i.test(navigator.userAgent)
  if (mem <= 2 || cores <= 2) return 'low'
  if (mobile && mem <= 4) return 'medium'
  return 'high'
}

const TIER_CONFIG = {
  low: { maxP: 50, spawnPerFrame: 1, canvasScale: 0.6 },
  medium: { maxP: 90, spawnPerFrame: 2, canvasScale: 0.8 },
  high: { maxP: 140, spawnPerFrame: 3, canvasScale: 1.0 }
}

const FlameRing = memo(function FlameRing ({ radius, disabled }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const stateRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const tier = getDeviceTier()
    const cfg = TIER_CONFIG[tier]
    const scale = cfg.canvasScale
    const sprites = buildSprites()

    const DIM = (radius + 60) * 2
    canvas.width = Math.round(DIM * scale)
    canvas.height = Math.round(DIM * scale)

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true })
    ctx.scale(scale, scale)

    const W = DIM
    const H = DIM
    const cx = W / 2
    const cy = H / 2

    const pool = []
    const active = []

    function acquire () {
      return pool.length ? pool.pop() : {}
    }
    function release (p) {
      pool.push(p)
    }

    function reset (p) {
      const angle = Math.random() * Math.PI * 2
      const spread = (Math.random() - 0.5) * 16
      const r = radius + spread
      p.x = cx + Math.cos(angle) * r
      p.y = cy + Math.sin(angle) * r

      const tang = Math.cos(angle - Math.PI / 2)
      const radX = Math.cos(angle)
      const radY = Math.sin(angle)
      p.vx =
        tang * (0.25 + Math.random() * 0.35) +
        radX * 0.2 +
        (Math.random() - 0.5) * 0.3
      p.vy = radY * 0.15 + -(1.2 + Math.random() * 1.6)
      p.life = 0
      p.maxLife = 36 + Math.random() * 24

      p.szi = Math.floor(Math.random() * SPRITE_SIZES.length)
      p.coli = Math.floor(Math.random() * SPRITE_COLORS.length)
      p.size = SPRITE_SIZES[p.szi]
      return p
    }

    for (let i = 0; i < cfg.maxP; i++) {
      const p = reset(acquire())
      p.life = Math.random() * p.maxLife
      active.push(p)
    }

    let lastTime = 0

    function draw (ts) {
      animRef.current = requestAnimationFrame(draw)

      // Delta-time cap at 50ms (handles tab switching, background throttle)
      const dt = Math.min((ts - lastTime) / 16.67, 3)
      lastTime = ts

      ctx.clearRect(0, 0, W, H)

      const toSpawn = Math.round(cfg.spawnPerFrame * dt)
      for (let i = 0; i < toSpawn && active.length < cfg.maxP; i++) {
        active.push(reset(acquire()))
      }

      for (let i = active.length - 1; i >= 0; i--) {
        const p = active[i]
        p.life += dt

        if (p.life >= p.maxLife) {
          active.splice(i, 1)
          release(p)
          continue
        }

        const progress = p.life / p.maxLife

        const alpha =
          progress < 0.18 ? progress / 0.18 : 1 - (progress - 0.18) / 0.82

        const drag = 1 - progress * 0.35
        p.x += p.vx * dt * drag
        p.y += p.vy * dt * drag
        p.vx += (Math.random() - 0.5) * 0.12 * dt
        // Turbulence Y (slight flicker)
        p.vy += (Math.random() - 0.5) * 0.05 * dt

        const sizeMult =
          progress < 0.3
            ? 0.6 + (progress / 0.3) * 0.4
            : 1 - ((progress - 0.3) / 0.7) * 0.5
        const sz = p.size * sizeMult

        const sprite = sprites[p.szi][p.coli]

        ctx.globalAlpha = alpha * 0.85
        ctx.drawImage(sprite, p.x - sz, p.y - sz, sz * 2, sz * 2)
      }

      ctx.globalAlpha = 1
    }

    animRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animRef.current)
      active.length = 0
      pool.length = 0
    }
  }, [radius])

  const dim = (radius + 60) * 2
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: dim,
        height: dim,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 3,
        opacity: disabled ? 0.2 : 1,
        transition: 'opacity 0.8s ease',
        mixBlendMode: 'screen',
        imageRendering: 'auto'
      }}
    />
  )
})

// ──────────────────────────────────────────────────────────────────────────────

export function Wheel ({ onSpinComplete }) {
  const wheelRef = useRef(null)
  const pointerRef = useRef(null)
  const currentRotation = useRef(0)
  const tickRef = useRef(0)
  const pointerAnimRef = useRef(null)

  const [spinning, setSpinning] = useState(false)
  const [hasSpun, setHasSpun] = useState(false)
  const [devicePerformance, setDevicePerformance] = useState('high')

  const totalSectors = SECTORS.length
  const angleStep = 360 / totalSectors

  const segmentFillId = useMemo(
    () => ({
      red: 'segRedMetal',
      black: 'segBlackMetal',
      green: 'segGreenMetal'
    }),
    []
  )

  useEffect(() => {
    const checkPerformance = () => {
      const start = performance.now()
      let count = 0
      while (performance.now() - start < 5) count++
      if (count < 1000) {
        setDevicePerformance('low')
        document.documentElement.classList.add('reduced-animation')
      } else if (count < 2000) {
        setDevicePerformance('medium')
      } else {
        setDevicePerformance('high')
      }
    }

    if ('connection' in navigator) {
      const connection = navigator.connection
      if (
        connection?.effectiveType === 'slow-2g' ||
        connection?.effectiveType === '2g'
      ) {
        setDevicePerformance('low')
        document.documentElement.classList.add('reduced-animation')
      }
    }

    window.addEventListener('load', () => setTimeout(checkPerformance, 1000))

    return () => document.documentElement.classList.remove('reduced-animation')
  }, [])

  useEffect(() => {
    const initialOffset = -angleStep / 2
    if (!wheelRef.current) return
    wheelRef.current.style.transform = `rotate(${initialOffset}deg)`
    wheelRef.current.style.willChange = 'transform'
    currentRotation.current = initialOffset
    tickRef.current = Math.floor(initialOffset / angleStep)
  }, [angleStep])

  const kickPointer = useCallback(() => {
    const el = pointerRef.current
    if (!el || devicePerformance === 'low') return
    if (pointerAnimRef.current) {
      try {
        pointerAnimRef.current.cancel()
      } catch (e) {}
      pointerAnimRef.current = null
    }
    pointerAnimRef.current = el.animate(
      [
        { transform: 'translateX(-50%) rotate(0deg)' },
        { transform: 'translateX(-50%) rotate(-8deg)' },
        { transform: 'translateX(-50%) rotate(0deg)' }
      ],
      {
        duration: 120,
        easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        iterations: 1
      }
    )
  }, [devicePerformance])

  const handleSpinClick = async () => {
    if (spinning || hasSpun) return
    setSpinning(true)
    setHasSpun(true)

    try {
      const response = await requestSpinResult()
      const winnerIndex = response.winnerIndex
      const { targetRotation, fullSpins } = getTargetRotation(
        winnerIndex,
        totalSectors,
        currentRotation.current
      )

      tickRef.current = Math.floor(currentRotation.current / angleStep)

      spinWheel(
        wheelRef,
        targetRotation,
        {
          fullSpins,
          onUpdate: rotation => {
            const tickNow = Math.floor(rotation / angleStep)
            if (tickNow !== tickRef.current) {
              tickRef.current = tickNow
              kickPointer()
            }
          }
        },
        () => {
          currentRotation.current = targetRotation
          setSpinning(false)
          const prize = SECTORS[winnerIndex]
          if (onSpinComplete) onSpinComplete(prize)
        }
      )
    } catch (error) {
      console.error(error)
      setSpinning(false)
    }
  }

  const createSegmentPath = useCallback(
    i => {
      const startAngle = i * angleStep - 90
      const endAngle = (i + 1) * angleStep - 90
      const toRad = d => (Math.PI * d) / 180

      const x1 = CENTER + OUTER_RADIUS * Math.cos(toRad(startAngle))
      const y1 = CENTER + OUTER_RADIUS * Math.sin(toRad(startAngle))
      const x2 = CENTER + OUTER_RADIUS * Math.cos(toRad(endAngle))
      const y2 = CENTER + OUTER_RADIUS * Math.sin(toRad(endAngle))
      const x3 = CENTER + INNER_RADIUS * Math.cos(toRad(endAngle))
      const y3 = CENTER + INNER_RADIUS * Math.sin(toRad(endAngle))
      const x4 = CENTER + INNER_RADIUS * Math.cos(toRad(startAngle))
      const y4 = CENTER + INNER_RADIUS * Math.sin(toRad(startAngle))

      return `M ${x1} ${y1} A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${INNER_RADIUS} ${INNER_RADIUS} 0 0 0 ${x4} ${y4} Z`
    },
    [angleStep]
  )

  const getTextData = useCallback(
    i => {
      const midAngle = i * angleStep - 90 + angleStep / 2
      const radius = OUTER_RADIUS - 90
      const rad = (Math.PI * midAngle) / 180
      return {
        x: CENTER + radius * Math.cos(rad),
        y: CENTER + radius * Math.sin(rad),
        angle: midAngle
      }
    },
    [angleStep]
  )

  const getMetalGradient = useCallback(
    (value, i) => {
      const baseColor = getColor(value, i)
      if (baseColor.toLowerCase() === '#c62828')
        return `url(#${segmentFillId.red})`
      if (baseColor.toLowerCase() === '#111111')
        return `url(#${segmentFillId.black})`
      return `url(#${segmentFillId.green})`
    },
    [segmentFillId]
  )

  return (
    <div className={`${styles.wrapper} ${spinning ? styles.spinning : ''}`}>
      <img src={bgWheel} className={styles.glow} alt='' />

      <div className={styles.wheel} ref={wheelRef}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={styles.segments}>
          <defs>
            <linearGradient id='goldDivider' x1='0%' y1='0%' x2='100%' y2='0%'>
              <stop offset='0%' stopColor='#B8860B' />
              <stop offset='50%' stopColor='#FFD700' />
              <stop offset='100%' stopColor='#B8860B' />
            </linearGradient>

            <radialGradient id={segmentFillId.red} cx='50%' cy='50%' r='70%'>
              <stop offset='0%' stopColor={lightenColor('#c62828', 22)} />
              <stop offset='55%' stopColor='#c62828' />
              <stop offset='100%' stopColor={darkenColor('#c62828', 18)} />
            </radialGradient>

            <radialGradient id={segmentFillId.black} cx='50%' cy='50%' r='70%'>
              <stop offset='0%' stopColor={lightenColor('#111111', 18)} />
              <stop offset='60%' stopColor='#111111' />
              <stop offset='100%' stopColor={darkenColor('#111111', 25)} />
            </radialGradient>

            <radialGradient id={segmentFillId.green} cx='50%' cy='50%' r='70%'>
              <stop offset='0%' stopColor={lightenColor('#1b8f3a', 22)} />
              <stop offset='55%' stopColor='#1b8f3a' />
              <stop offset='100%' stopColor={darkenColor('#1b8f3a', 18)} />
            </radialGradient>
          </defs>

          {SECTORS.map((value, i) => {
            const t = getTextData(i)
            return (
              <g key={i}>
                <path
                  d={createSegmentPath(i)}
                  fill={getMetalGradient(value, i)}
                />
                <text
                  x={t.x}
                  y={t.y}
                  textAnchor='start'
                  dominantBaseline='middle'
                  transform={`rotate(${t.angle} ${t.x} ${t.y})`}
                >
                  {value}
                </text>
              </g>
            )
          })}

          {SECTORS.map((_, i) => {
            const startAngle = i * angleStep - 90
            const rad = (Math.PI * startAngle) / 180
            const xOuter = CENTER + OUTER_RADIUS * Math.cos(rad)
            const yOuter = CENTER + OUTER_RADIUS * Math.sin(rad)
            const xInner = CENTER + INNER_RADIUS * Math.cos(rad)
            const yInner = CENTER + INNER_RADIUS * Math.sin(rad)
            return (
              <g key={`divider-${i}`}>
                <line
                  x1={xInner}
                  y1={yInner}
                  x2={xOuter}
                  y2={yOuter}
                  stroke='url(#goldDivider)'
                  strokeWidth='6'
                  strokeLinecap='round'
                />
                <line
                  x1={xInner}
                  y1={yInner}
                  x2={xOuter}
                  y2={yOuter}
                  stroke='rgba(255,255,255,0.4)'
                  strokeWidth='2'
                  strokeLinecap='round'
                />
              </g>
            )
          })}

          <circle
            cx={CENTER}
            cy={CENTER}
            r={INNER_RADIUS - 2}
            fill='none'
            stroke='url(#goldDivider)'
            strokeWidth='6'
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={OUTER_RADIUS + 2}
            fill='none'
            stroke='url(#goldDivider)'
            strokeWidth='6'
          />
          <image
            href={InnerRim}
            x='120'
            y='120'
            width='492'
            height='492'
            pointerEvents='none'
          />

          {/* ── Backlight reflection overlay ── */}
          <defs>
            <radialGradient
              id='backlightReflect'
              cx='50%'
              cy='30%'
              r='65%'
              fx='50%'
              fy='18%'
            >
              <stop offset='0%' stopColor='rgba(255,255,255,0.18)' />
              <stop offset='40%' stopColor='rgba(255,230,180,0.07)' />
              <stop offset='100%' stopColor='rgba(0,0,0,0)' />
            </radialGradient>
            <radialGradient id='backlightEdge' cx='50%' cy='50%' r='50%'>
              <stop offset='60%' stopColor='rgba(0,0,0,0)' />
              <stop offset='100%' stopColor='rgba(255,180,60,0.13)' />
            </radialGradient>
            <clipPath id='wheelClip'>
              <circle cx={CENTER} cy={CENTER} r={OUTER_RADIUS} />
            </clipPath>
          </defs>

          {/* Top glare — как будто свет сверху отражается */}
          <ellipse
            cx={CENTER}
            cy={CENTER - OUTER_RADIUS * 0.18}
            rx={OUTER_RADIUS * 0.72}
            ry={OUTER_RADIUS * 0.42}
            fill='url(#backlightReflect)'
            clipPath='url(#wheelClip)'
            pointerEvents='none'
            style={{ mixBlendMode: 'screen' }}
          />

          {/* Rim edge glow — ободочный отсвет */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={OUTER_RADIUS - 2}
            fill='url(#backlightEdge)'
            clipPath='url(#wheelClip)'
            pointerEvents='none'
            style={{ mixBlendMode: 'screen' }}
          />

          {/* Subtle specular streak — узкий блик */}
          <ellipse
            cx={CENTER - OUTER_RADIUS * 0.08}
            cy={CENTER - OUTER_RADIUS * 0.52}
            rx={OUTER_RADIUS * 0.22}
            ry={OUTER_RADIUS * 0.07}
            fill='rgba(255,255,255,0.12)'
            transform={`rotate(-20 ${CENTER} ${CENTER})`}
            clipPath='url(#wheelClip)'
            pointerEvents='none'
            style={{ mixBlendMode: 'screen' }}
          />
        </svg>

        <img src={Rim} className={styles.rim} alt='' />

        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className={styles.pegsSvg}
          aria-hidden='true'
        >
          <defs>
            <radialGradient id='pegBlack' cx='35%' cy='30%' r='75%'>
              <stop offset='0%' stopColor='rgba(90,90,90,0.95)' />
              <stop offset='40%' stopColor='rgba(25,25,25,0.98)' />
              <stop offset='100%' stopColor='rgba(0,0,0,1)' />
            </radialGradient>
            <filter id='pegShadow' x='-60%' y='-60%' width='220%' height='220%'>
              <feDropShadow
                dx='0'
                dy='2'
                stdDeviation='1.2'
                floodOpacity='0.45'
              />
            </filter>
          </defs>
          {SECTORS.map((_, i) => {
            const a = i * angleStep - 90
            const rad = (Math.PI * a) / 180
            const pegR = 10
            const pegRadiusFromCenter = OUTER_RADIUS - 20
            const x = CENTER + pegRadiusFromCenter * Math.cos(rad)
            const y = CENTER + pegRadiusFromCenter * Math.sin(rad)
            return (
              <g key={`peg-${i}`} filter='url(#pegShadow)'>
                <circle cx={x} cy={y} r={pegR} fill='url(#pegBlack)' />
                <circle
                  cx={x}
                  cy={y}
                  r={pegR - 2.5}
                  fill='none'
                  stroke='rgba(255,255,255,0.10)'
                  strokeWidth='2'
                />
              </g>
            )
          })}
        </svg>
      </div>

      <div
        className={`${styles.buttonContainer} ${
          hasSpun ? styles.buttonDimmed : ''
        }`}
        onClick={!hasSpun && !spinning ? handleSpinClick : undefined}
        style={{ pointerEvents: hasSpun ? 'none' : 'auto' }}
      >
        <FlameRing radius={118} disabled={hasSpun} />
        <div className={styles.buttonGlow} />
        <img src={bgButton} className={styles.buttonBg} alt='' />
        <img src={smallRim} className={styles.buttonRim} alt='' />
        <img
          src={Button}
          className={styles.buttonForeground}
          alt='Крутить колесо'
        />
        <span className={styles.buttonLabel}>SPIN</span>
      </div>

      <img ref={pointerRef} src={Arrow} className={styles.pointer} alt='' />
    </div>
  )
}

function lightenColor (color, percent) {
  return shiftColor(color, Math.abs(percent))
}
function darkenColor (color, percent) {
  return shiftColor(color, -Math.abs(percent))
}
function shiftColor (hex, percent) {
  const c = String(hex || '').replace('#', '')
  if (c.length !== 6) return hex
  const num = parseInt(c, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  const t = percent < 0 ? 0 : 255
  const p = Math.min(100, Math.max(0, Math.abs(percent))) / 100
  const nr = Math.round((t - r) * p + r)
  const ng = Math.round((t - g) * p + g)
  const nb = Math.round((t - b) * p + b)
  const toHex = v => v.toString(16).padStart(2, '0')
  return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`
}
