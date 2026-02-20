import React, { useRef, useState, useEffect } from 'react'
import { SECTORS, getColor } from './Wheel.config'
import { getTargetRotation } from './Wheel.logic'
import { spinWheel } from './Wheel.animation'
import { requestSpinResult } from '../../services/api'
import { gsap } from 'gsap'
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
  const sectorsRef = useRef(null)
  const currentRotation = useRef(0)

  const [spinning, setSpinning] = useState(false)
  const [hasSpun, setHasSpun] = useState(false)

  const totalSectors = SECTORS.length
  const angleStep = 360 / totalSectors

  useEffect(() => {
    if (!sectorsRef.current) return

    const initialOffset = -angleStep / 2

    gsap.set(sectorsRef.current, {
      rotation: initialOffset,
      transformOrigin: '50% 50%'
    })

    currentRotation.current = initialOffset
  }, [angleStep])

  // ---------------- SPIN ----------------

  const handleSpinClick = async () => {
    if (spinning || hasSpun) return

    setSpinning(true)
    setHasSpun(true)

    try {
      const response = await requestSpinResult()
      const winnerIndex = response.winnerIndex

      const rotation = getTargetRotation(
        winnerIndex,
        totalSectors,
        currentRotation.current
      )

      spinWheel(sectorsRef, rotation, () => {
        currentRotation.current = rotation % 360
        setSpinning(false)

        const prize = SECTORS[winnerIndex]
        if (onSpinComplete) {
          onSpinComplete(prize)
        }
      })
    } catch (error) {
      console.error(error)
      setSpinning(false)
    }
  }

  // ---------------- SVG ----------------

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
    return `url(#metalGradient-${i})`
  }

  return (
    <div className={styles.wrapper}>
      <img src={bgWheel} className={styles.glow} alt='' />

      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={styles.segments}>
        <defs>
          <linearGradient id='goldDivider' x1='0%' y1='0%' x2='100%' y2='0%'>
            <stop offset='0%' stopColor='#B8860B'>
              <animate
                attributeName='stopColor'
                values='#B8860B;#FFD700;#B8860B'
                dur='3s'
                repeatCount='indefinite'
              />
            </stop>
            <stop offset='50%' stopColor='#FFD700'>
              <animate
                attributeName='stopColor'
                values='#FFD700;#FDB931;#FFD700'
                dur='3s'
                repeatCount='indefinite'
              />
            </stop>
            <stop offset='100%' stopColor='#B8860B'>
              <animate
                attributeName='stopColor'
                values='#B8860B;#FFD700;#B8860B'
                dur='3s'
                repeatCount='indefinite'
              />
            </stop>
          </linearGradient>

          <filter id='metalShine' x='-20%' y='-20%' width='140%' height='140%'>
            <feGaussianBlur in='SourceAlpha' stdDeviation='2' result='blur' />
            <feSpecularLighting
              in='blur'
              surfaceScale='3'
              specularConstant='0.8'
              specularExponent='20'
              lightingColor='#FFD700'
              result='specOut'
            >
              <fePointLight x='-5000' y='-10000' z='20000' />
            </feSpecularLighting>
            <feComposite
              in='specOut'
              in2='SourceAlpha'
              operator='in'
              result='specOut'
            />
            <feComposite
              in='SourceGraphic'
              in2='specOut'
              operator='arithmetic'
              k1='0'
              k2='1'
              k3='1'
              k4='0'
              result='litPaint'
            />
          </filter>

          <filter id='metalTexture' x='0%' y='0%' width='100%' height='100%'>
            <feTurbulence
              baseFrequency='0.05'
              numOctaves='2'
              result='turbulence'
            />
            <feColorMatrix
              in='turbulence'
              mode='saturate'
              values='2'
              result='saturated'
            />
            <feBlend
              in='SourceGraphic'
              in2='saturated'
              mode='overlay'
              opacity='0.1'
            />
          </filter>

          {SECTORS.map((color, i) => {
            const baseColor = getColor(color, i)
            return (
              <radialGradient
                key={`metal-${i}`}
                id={`metalGradient-${i}`}
                cx='50%'
                cy='50%'
                r='70%'
                fx='30%'
                fy='30%'
              >
                <stop offset='0%' stopColor={baseColor} stopOpacity='1'>
                  <animate
                    attributeName='stopColor'
                    values={`${baseColor};${lightenColor(
                      baseColor,
                      30
                    )};${baseColor}`}
                    dur='4s'
                    repeatCount='indefinite'
                  />
                </stop>
                <stop
                  offset='50%'
                  stopColor={lightenColor(baseColor, 20)}
                  stopOpacity='0.9'
                >
                  <animate
                    attributeName='stopColor'
                    values={`${lightenColor(
                      baseColor,
                      20
                    )};${baseColor};${lightenColor(baseColor, 20)}`}
                    dur='4s'
                    repeatCount='indefinite'
                  />
                </stop>
                <stop
                  offset='100%'
                  stopColor={darkenColor(baseColor, 20)}
                  stopOpacity='1'
                >
                  <animate
                    attributeName='stopColor'
                    values={`${darkenColor(
                      baseColor,
                      20
                    )};${baseColor};${darkenColor(baseColor, 20)}`}
                    dur='4s'
                    repeatCount='indefinite'
                  />
                </stop>
              </radialGradient>
            )
          })}
        </defs>

        <g ref={sectorsRef}>
          {/* Сегменты с металлическим фоном */}
          {SECTORS.map((value, i) => {
            const t = getTextData(i)
            return (
              <g key={i}>
                <path
                  d={createSegmentPath(i)}
                  fill={getMetalGradient(value, i)}
                  filter='url(#metalTexture)'
                />
                <text
                  x={t.x}
                  y={t.y}
                  fill='white'
                  fontSize='30'
                  fontWeight='800'
                  textAnchor='start'
                  dominantBaseline='middle'
                  transform={`rotate(${t.angle} ${t.x} ${t.y})`}
                  style={{
                    textShadow:
                      '2px 2px 4px rgba(0,0,0,0.5), 0 0 10px rgba(255,215,0,0.3)'
                  }}
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
                  filter='url(#metalShine)'
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
            filter='url(#metalShine)'
          />

          <circle
            cx={CENTER}
            cy={CENTER}
            r={OUTER_RADIUS + 2}
            fill='none'
            stroke='url(#goldDivider)'
            strokeWidth='6'
            filter='url(#metalShine)'
          />
        </g>

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

      <div
        className={styles.buttonContainer}
        onClick={!hasSpun && !spinning ? handleSpinClick : undefined}
        style={{
          pointerEvents: hasSpun ? 'none' : 'auto'
        }}
      >
        <img src={Button} className={styles.button} alt='' />
      </div>
      <img src={Arrow} className={styles.pointer} alt='' />
    </div>
  )
}

// Вспомогательные функции для работы с цветами
function lightenColor (color, percent) {
  return color
}

function darkenColor (color, percent) {
  return color
}
