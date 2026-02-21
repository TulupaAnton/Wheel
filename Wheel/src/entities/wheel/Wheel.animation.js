export const spinWheel = (wheelRef, targetRotation, opts = {}, onComplete) => {
  const el = wheelRef?.current
  if (!el) return

  const fullSpins = typeof opts.fullSpins === 'number' ? opts.fullSpins : 6

  const duration = Math.random() * 2000 + 4000

  const bounceDeg = Math.min(5, 3 + Math.random() * 2)

  const start = performance.now()
  const startRotation = getCurrentRotation(el)

  const targetDelta = normalize(targetRotation - startRotation)

  const totalRotation = fullSpins * 360 + targetDelta - bounceDeg

  function easeOutCubic (t) {
    return 1 - Math.pow(1 - t, 3)
  }

  function animate (now) {
    const elapsed = now - start
    const progress = Math.min(elapsed / duration, 1)
    const eased = easeOutCubic(progress)

    // Останавливаемся на позиции "недокат"
    const rotation = startRotation + eased * totalRotation

    el.style.transform = `rotate(${rotation}deg)`

    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      bounce(rotation)
    }
  }

  function bounce (shortStopRotation) {
    const bounceStart = performance.now()
    const bounceDuration = 800

    function bounceFrame (now) {
      const t = Math.min((now - bounceStart) / bounceDuration, 1)

      const eased = t * (2 - t)

      const rotation = shortStopRotation + eased * bounceDeg

      el.style.transform = `rotate(${rotation}deg)`

      if (t < 1) {
        requestAnimationFrame(bounceFrame)
      } else {
        el.style.transform = `rotate(${targetRotation}deg)`
        if (onComplete) onComplete()
      }
    }

    requestAnimationFrame(bounceFrame)
  }

  requestAnimationFrame(animate)
}

function normalize (angle) {
  return ((angle % 360) + 360) % 360
}

function getCurrentRotation (el) {
  const st = window.getComputedStyle(el)
  const tr = st.transform
  if (tr === 'none') return 0

  const values = tr.split('(')[1].split(')')[0].split(',')
  const a = values[0]
  const b = values[1]
  return Math.round(Math.atan2(b, a) * (180 / Math.PI))
}
