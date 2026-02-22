export const spinWheel = (wheelRef, targetRotation, opts = {}, onComplete) => {
  const el = wheelRef?.current
  if (!el) return

  const fullSpins = typeof opts.fullSpins === 'number' ? opts.fullSpins : 6
  // Увеличиваем длительность для более медленной анимации
  const duration = Math.random() * 2000 + 5000 // 5-7 секунд вместо 4-6
  const bounceDeg = Math.min(4, 2 + Math.random() * 2) // Уменьшаем отскок

  const startRotation = getCurrentRotation(el)
  const targetDelta = normalize(targetRotation - startRotation)
  const totalRotation = fullSpins * 360 + targetDelta - bounceDeg

  // Используем более плавные кривые easing
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3)
  const easeOutQuart = t => 1 - Math.pow(1 - t, 4) // Еще более плавное замедление
  const easeOutBack = t => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  }

  // Оптимизированная установка transform с аппаратным ускорением
  const setTransform = rotation => {
    // Используем matrix3d для максимальной производительности
    el.style.transform = `matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1) rotate(${rotation}deg)`
  }

  let rafId = null
  let bounceRafId = null
  let start = null

  const onUpdate = typeof opts.onUpdate === 'function' ? opts.onUpdate : null

  // Оптимизированный анимационный цикл с фиксированным FPS
  function animate (timestamp) {
    if (!start) start = timestamp

    const elapsed = timestamp - start
    const progress = Math.min(elapsed / duration, 1)

    // Используем более плавную кривую для основной анимации
    const rotation = startRotation + easeOutQuart(progress) * totalRotation

    // Используем requestAnimationFrame с приоритетом
    setTransform(rotation)
    if (onUpdate) onUpdate(rotation, progress)

    if (progress < 1) {
      rafId = requestAnimationFrame(animate)
    } else {
      rafId = null
      // Небольшая задержка перед отскоком для более естественного перехода
      setTimeout(() => bounce(rotation), 50)
    }
  }

  function bounce (shortStopRotation) {
    const bounceStart = performance.now()
    const bounceDuration = 1000 // Увеличиваем длительность отскока

    function bounceFrame (timestamp) {
      const elapsed = timestamp - bounceStart
      const progress = Math.min(elapsed / bounceDuration, 1)

      // Используем easing с эффектом пружины для отскока
      const bounceProgress = easeOutBack(progress)
      const rotation = shortStopRotation + bounceProgress * bounceDeg

      setTransform(rotation)
      if (onUpdate) onUpdate(rotation, 1 + progress * 0.1)

      if (progress < 1) {
        bounceRafId = requestAnimationFrame(bounceFrame)
      } else {
        bounceRafId = null
        // Финальная точная установка
        setTransform(targetRotation)
        if (onUpdate) onUpdate(targetRotation, 1)
        if (onComplete) onComplete()
      }
    }

    bounceRafId = requestAnimationFrame(bounceFrame)
  }

  // Очищаем предыдущие анимации
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  if (bounceRafId) {
    cancelAnimationFrame(bounceRafId)
    bounceRafId = null
  }

  start = null
  rafId = requestAnimationFrame(animate)
}

function normalize (angle) {
  return ((angle % 360) + 360) % 360
}

function getCurrentRotation (el) {
  const st = window.getComputedStyle(el)
  const tr = st.transform
  if (tr === 'none') return 0

  // Оптимизированное получение угла поворота
  const values = tr.split('(')[1].split(')')[0].split(',')
  const a = parseFloat(values[0])
  const b = parseFloat(values[1])
  return Math.round(Math.atan2(b, a) * (180 / Math.PI))
}
