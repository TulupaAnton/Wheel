import React, { useRef, useState, useEffect, useMemo } from 'react'
import { SECTORS, getColor } from './Wheel.config'
import { getTargetRotation } from './Wheel.logic'
import { spinWheel } from './Wheel.animation'
import { requestSpinResult } from '../../services/api'

import styles from './Wheel.module.css'

import bgWheel from '../../shared/assets/images/bgWheel.png'
import Button from '../../shared/assets/images/button.png'
import Arrow from '../../shared/assets/images/arrow.png'
import Rim from '../../shared/assets/images/rim.png'
import InnerRim from '../../shared/assets/images/innerRim.png'

const SIZE = 733
const CENTER = SIZE / 2
const OUTER_RADIUS = 350
const INNER_RADIUS = 155

export function Wheel ({ onSpinComplete }) {
  const wheelRef = useRef(null)
  const currentRotation = useRef(0)

  const [spinning, setSpinning] = useState(false)
  const [hasSpun, setHasSpun] = useState(false)

  const totalSectors = SECTORS.length
  const angleStep = 360 / totalSectors

  const segmentFillId = useMemo(() => {
    return {
      red: 'segRedMetal',
      black: 'segBlackMetal',
      green: 'segGreenMetal'
    }
  }, [])

  useEffect(() => {
    const initialOffset = -angleStep / 2

    if (!wheelRef.current) return

    wheelRef.current.style.transform = `rotate(${initialOffset}deg)`
    wheelRef.current.style.willChange = 'transform'

    currentRotation.current = initialOffset
  }, [angleStep])
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

      spinWheel(wheelRef, targetRotation, { fullSpins }, () => {
        // Важно: сохраняем абсолютный угол (GSAP работает в абсолютных градусах)
        currentRotation.current = targetRotation
        setSpinning(false)

        const prize = SECTORS[winnerIndex]
        if (onSpinComplete) onSpinComplete(prize)
      })
    } catch (error) {
      console.error(error)
      setSpinning(false)
    }
  }

  const createSegmentPath = i => {
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

    return `
      M ${x1} ${y1}
      A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 0 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${INNER_RADIUS} ${INNER_RADIUS} 0 0 0 ${x4} ${y4}
      Z
    `
  }

  const getTextData = i => {
    const midAngle = i * angleStep - 90 + angleStep / 2
    const radius = OUTER_RADIUS - 90
    const rad = (Math.PI * midAngle) / 180

    return {
      x: CENTER + radius * Math.cos(rad),
      y: CENTER + radius * Math.sin(rad),
      angle: midAngle
    }
  }

  const getMetalGradient = (color, i) => {
    const baseColor = getColor(color, i)

    if (baseColor.toLowerCase() === '#c62828')
      return `url(#${segmentFillId.red})`
    if (baseColor.toLowerCase() === '#111111')
      return `url(#${segmentFillId.black})`

    return `url(#${segmentFillId.green})`
  }

  return (
    <div className={styles.wrapper}>
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
              <stop offset='55%' stopColor={'#c62828'} />
              <stop offset='100%' stopColor={darkenColor('#c62828', 18)} />
            </radialGradient>

            <radialGradient id={segmentFillId.black} cx='50%' cy='50%' r='70%'>
              <stop offset='0%' stopColor={lightenColor('#111111', 18)} />
              <stop offset='60%' stopColor={'#111111'} />
              <stop offset='100%' stopColor={darkenColor('#111111', 25)} />
            </radialGradient>

            <radialGradient id={segmentFillId.green} cx='50%' cy='50%' r='70%'>
              <stop offset='0%' stopColor={lightenColor('#1b8f3a', 22)} />
              <stop offset='55%' stopColor={'#1b8f3a'} />
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
                  stroke='rgba(255, 255, 255, 0.4)'
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
        </svg>

        <img src={Rim} className={styles.rim} alt='' />
      </div>

      <div
        className={styles.buttonContainer}
        onClick={!hasSpun && !spinning ? handleSpinClick : undefined}
        style={{ pointerEvents: hasSpun ? 'none' : 'auto' }}
      >
        <img src={Button} className={styles.button} alt='' />
      </div>

      <img src={Arrow} className={styles.pointer} alt='' />
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
