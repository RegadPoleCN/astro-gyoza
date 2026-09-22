import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useRef, useCallback } from 'react'
import {
  backgroundAtom,
  particleConfigAtom,
  adaptivePerformanceAtom,
  performanceDegradedAtom,
  type ParticleShape,
  type ParticleConfig,
} from '@/store/background'
import { themeAtom } from '@/store/theme'
import { getSystemTheme } from '@/utils/theme'
import { useMediaQuery, useDeepCompareEffect } from '@/hooks'
import { FallbackBackground } from '@/components/background/FallbackBackground'
import { GradientBackground } from '@/components/background/GradientBackground'
import { CustomBackground } from '@/components/background/CustomBackground'

interface Particle {
  x: number
  y: number
  size: number
  targetSize: number
  speedY: number
  targetSpeedY: number
  speedX: number
  opacity: number
  drift: number
  driftSpeed: number
  rotation: number
  rotationSpeed: number
  acceleration: number
  accelerationPhase: number
  history?: Array<{ x: number; y: number }>
}

const MOBILE_BREAKPOINT = 768
const MIN_MOBILE_PARTICLES = 12
const MAX_MOBILE_PARTICLES = 18
const DEFAULT_DESKTOP_PARTICLES = 100
const FPS_SAMPLE_SIZE = 60
const LERP_FACTOR = 0.05

const LOW_FPS_THRESHOLD = 30
const LOW_FPS_DURATION = 3000
const REDUCE_RATIO = 0.8
const MIN_PARTICLES = 10

const HIGH_FPS_THRESHOLD = 55
const HIGH_FPS_DURATION = 5000
const INCREASE_RATIO = 1.1

const ADAPTIVE_COOLDOWN = 1000

const HORIZONTAL_SPEED_RANGE = 0.5
const OPACITY_MIN = 0.2
const OPACITY_MAX_OFFSET = 0.6
const DRIFT_SPEED_MIN = 0.01
const DRIFT_SPEED_MAX = 0.02
const ROTATION_SPEED_MAX = 0.02
const ACCELERATION_PHASE_INCREMENT = 0.02
const ACCELERATION_AMPLITUDE = 0.03
const DRIFT_BASE_AMPLITUDE = 0.5

function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor
}

function resolveTheme(theme: string): 'dark' | 'light' {
  if (theme === 'dark' || theme === 'light') return theme
  return getSystemTheme()
}

function getDispersedX(
  canvasWidth: number,
  existingParticles: Particle[],
  bucketCount: number
): number {
  if (bucketCount <= 1 || existingParticles.length === 0) {
    return Math.random() * canvasWidth
  }
  const bucketWidth = canvasWidth / bucketCount
  const counts = new Array(bucketCount).fill(0)
  for (let i = 0; i < existingParticles.length; i++) {
    const idx = Math.min(bucketCount - 1, Math.max(0, Math.floor(existingParticles[i].x / bucketWidth)))
    counts[idx]++
  }

  let minIdx = 0
  for (let i = 1; i < bucketCount; i++) {
    if (counts[i] < counts[minIdx]) {
      minIdx = i
    }
  }

  const jitter = (Math.random() * 0.8 + 0.1) * bucketWidth
  return minIdx * bucketWidth + jitter
}

function createParticle(
  canvasWidth: number,
  canvasHeight: number,
  config: {
    minSize: number
    maxSize: number
    minSpeed: number
    maxSpeed: number
    opacity: number
  },
  initialX?: number,
  initialY?: number
): Particle {
  const size = config.minSize + Math.random() * (config.maxSize - config.minSize)
  const speedY = config.minSpeed + Math.random() * (config.maxSpeed - config.minSpeed)
  return {
    x: initialX !== undefined ? initialX : Math.random() * canvasWidth,
    y: initialY !== undefined ? initialY : Math.random() * canvasHeight,
    size,
    targetSize: size,
    speedY,
    targetSpeedY: speedY,
    speedX: (Math.random() - 0.5) * HORIZONTAL_SPEED_RANGE,
    opacity: OPACITY_MIN + Math.random() * Math.min(config.opacity - OPACITY_MIN, OPACITY_MAX_OFFSET),
    drift: Math.random() * Math.PI * 2,
    driftSpeed: DRIFT_SPEED_MIN + Math.random() * DRIFT_SPEED_MAX,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * ROTATION_SPEED_MAX,
    acceleration: 0,
    accelerationPhase: Math.random() * Math.PI * 2,
    history: [],
  }
}

function getParticleColor(resolvedTheme: 'dark' | 'light', customColor: string | undefined, opacity: number = 1): string {
  if (customColor) {
    if (customColor.startsWith('rgba(') || customColor.startsWith('rgb(')) {
      return customColor.replace(/[\d.]+\)$/g, `${opacity})`)
    }
    if (customColor.startsWith('#')) {
      const r = parseInt(customColor.slice(1, 3), 16)
      const g = parseInt(customColor.slice(3, 5), 16)
      const b = parseInt(customColor.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }
    return customColor
  }
  if (resolvedTheme === 'dark') {
    return `rgba(200, 220, 255, ${opacity})`
  }
  return `rgba(100, 120, 180, ${opacity})`
}

function replaceAlpha(color: string, newAlpha: string): string {
  const match = color.match(/^(rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*)[\d.]+(\s*\))$/)
  if (match) {
    return match[1] + newAlpha + match[2]
  }
  return color
}

type ShapeDrawer = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  color: string,
  opacity: number
) => void

function drawCircleShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  _rotation: number,
  color: string,
  opacity: number
): void {
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.beginPath()
  ctx.arc(x, y, size / 2, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.restore()
}

function drawSnowflakeShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  color: string,
  opacity: number
): void {
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3
    ctx.moveTo(0, 0)
    ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size)
    if (size > 3) {
      const branchLen = size * 0.6
      const sub1 = angle + Math.PI / 6
      const sub2 = angle - Math.PI / 6
      ctx.moveTo(Math.cos(angle) * branchLen, Math.sin(angle) * branchLen)
      ctx.lineTo(
        Math.cos(angle) * branchLen + Math.cos(sub1) * (size * 0.35),
        Math.sin(angle) * branchLen + Math.sin(sub1) * (size * 0.35)
      )
      ctx.moveTo(Math.cos(angle) * branchLen, Math.sin(angle) * branchLen)
      ctx.lineTo(
        Math.cos(angle) * branchLen + Math.cos(sub2) * (size * 0.35),
        Math.sin(angle) * branchLen + Math.sin(sub2) * (size * 0.35)
      )
    }
  }
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(1, size * 0.15)
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.restore()
}

function drawHeartShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  color: string,
  opacity: number
): void {
  const s = size * 0.8
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.beginPath()
  ctx.moveTo(0, s * 0.3)
  ctx.bezierCurveTo(-s * 0.5, -s * 0.3, -s, s * 0.1, 0, s)
  ctx.bezierCurveTo(s, s * 0.1, s * 0.5, -s * 0.3, 0, s * 0.3)
  ctx.fillStyle = color
  ctx.fill()
  ctx.restore()
}

function drawStarShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  color: string,
  opacity: number
): void {
  const outerR = size
  const innerR = size * 0.4
  const spikes = 5
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.translate(x, y)
  ctx.rotate(rotation - Math.PI / 2)
  ctx.beginPath()
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const angle = (i * Math.PI) / spikes
    if (i === 0) {
      ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r)
    } else {
      ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r)
    }
  }
  ctx.closePath()
  ctx.shadowColor = color
  ctx.shadowBlur = size * 0.6
  ctx.fillStyle = color
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.restore()
}

function drawBubbleShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  _rotation: number,
  color: string,
  opacity: number
): void {
  const r = size / 2
  ctx.save()
  ctx.globalAlpha = opacity * 0.4
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()

  ctx.globalAlpha = opacity * 0.6
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(0.5, size * 0.08)
  ctx.stroke()

  ctx.globalAlpha = opacity * 0.9
  ctx.beginPath()
  ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.15, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  ctx.globalAlpha = opacity * 0.5
  ctx.beginPath()
  ctx.arc(x - r * 0.1, y - r * 0.5, r * 0.08, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.restore()
}

function drawPetalShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  color: string,
  opacity: number
): void {
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.beginPath()
  ctx.moveTo(0, -size)
  ctx.bezierCurveTo(size * 0.6, -size * 0.6, size * 0.4, size * 0.3, 0, size)
  ctx.bezierCurveTo(-size * 0.4, size * 0.3, -size * 0.6, -size * 0.6, 0, -size)
  ctx.fillStyle = color
  ctx.fill()
  ctx.restore()
}

const shapeDrawers: Record<ParticleShape, ShapeDrawer> = {
  circle: drawCircleShape,
  snowflake: drawSnowflakeShape,
  heart: drawHeartShape,
  star: drawStarShape,
  bubble: drawBubbleShape,
  petal: drawPetalShape,
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationFrameRef = useRef<number>(0)
  const loopFnRef = useRef<(() => void) | null>(null)
  const lastTimeRef = useRef<number>(0)
  const frameCountRef = useRef<number>(0)
  const fpsRef = useRef<number>(60)
  const reducedMotionRef = useRef<boolean>(false)
  const prevConfigRef = useRef<ParticleConfig | null>(null)

  const lowFpsStartRef = useRef<number>(0)
  const highFpsStartRef = useRef<number>(0)
  const currentAdaptiveCountRef = useRef<number>(0)
  const lastAdjustTimeRef = useRef<number>(0)
  const isDegradedRef = useRef<boolean>(false)
  const scrollDeltaYRef = useRef(0)
  const lastScrollYRef = useRef(0)

  const backgroundConfig = useAtomValue(backgroundAtom)
  const particleConfig = useAtomValue(particleConfigAtom)
  const adaptivePerformance = useAtomValue(adaptivePerformanceAtom)
  const setPerformanceDegraded = useSetAtom(performanceDegradedAtom)
  const theme = useAtomValue(themeAtom)

  const prevThemeRef = useRef<string>(theme)
  const backgroundConfigRef = useRef(backgroundConfig)
  const particleConfigRef = useRef(particleConfig)

  useEffect(() => {
    backgroundConfigRef.current = backgroundConfig
    particleConfigRef.current = particleConfig
  }, [backgroundConfig, particleConfig])

  const resolvedTheme = resolveTheme(theme)
  const resolvedThemeRef = useRef(resolvedTheme)
  resolvedThemeRef.current = resolvedTheme

  const isMobile = useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

  const initParticles = useCallback(
    (canvasWidth: number, canvasHeight: number) => {
      const config = particleConfigRef.current
      const count = isMobile
        ? Math.max(MIN_MOBILE_PARTICLES, Math.min(MAX_MOBILE_PARTICLES, Math.floor(canvasWidth / 25)))
        : config.count || DEFAULT_DESKTOP_PARTICLES

      const bucketCount = isMobile ? 6 : 18
      const particles: Particle[] = []
      for (let i = 0; i < count; i++) {
        const bucketIndex = i % bucketCount
        const bucketWidth = canvasWidth / bucketCount
        const initialX = bucketIndex * bucketWidth + Math.random() * bucketWidth
        const initialY = Math.random() * canvasHeight
        particles.push(createParticle(canvasWidth, canvasHeight, config, initialX, initialY))
      }
      particlesRef.current = particles
      currentAdaptiveCountRef.current = count
      isDegradedRef.current = false
      lowFpsStartRef.current = 0
      highFpsStartRef.current = 0
    },
    [isMobile]
  )

  const updateParticle = useCallback((particle: Particle, canvasWidth: number, canvasHeight: number) => {
    if (reducedMotionRef.current) return

    const config = particleConfigRef.current
    const driftAmplitude = config.driftAmplitude ?? 0.5
    const rotationSpeedMultiplier = config.rotationSpeed ?? 1.0

    particle.speedY = lerp(particle.speedY, particle.targetSpeedY, LERP_FACTOR)
    particle.size = lerp(particle.size, particle.targetSize, LERP_FACTOR)

    particle.accelerationPhase += ACCELERATION_PHASE_INCREMENT
    particle.acceleration = Math.sin(particle.accelerationPhase) * ACCELERATION_AMPLITUDE

    // 桌面端内部分层视差响应（基于粒子大小比例模拟 Z 轴纵深），不改动 DOM Canvas
    let parallaxY = 0
    if (!isMobile && scrollDeltaYRef.current !== 0) {
      const sizeSpan = Math.max(1, config.maxSize - config.minSize)
      const depthRatio = Math.max(0, Math.min(1, (particle.size - config.minSize) / sizeSpan))
      const parallaxSpeed = 0.02 + depthRatio * 0.06
      parallaxY = -scrollDeltaYRef.current * parallaxSpeed
    }

    particle.y += particle.speedY + particle.acceleration + parallaxY
    particle.drift += particle.driftSpeed
    particle.x += particle.speedX + Math.sin(particle.drift) * DRIFT_BASE_AMPLITUDE * driftAmplitude
    particle.rotation += particle.rotationSpeed * rotationSpeedMultiplier

    const bucketCount = isMobile ? 6 : 18

    // 双向无缝环绕（向下落出或向上冲出均平滑回归对立边缘）
    if (particle.y > canvasHeight + particle.size) {
      particle.y = -particle.size
      particle.x = getDispersedX(canvasWidth, particlesRef.current, bucketCount)
      particle.history = []
    } else if (particle.y < -particle.size) {
      particle.y = canvasHeight + particle.size
      particle.x = getDispersedX(canvasWidth, particlesRef.current, bucketCount)
      particle.history = []
    }

    if (particle.x > canvasWidth + particle.size) {
      particle.x = -particle.size
      particle.history = []
    } else if (particle.x < -particle.size) {
      particle.x = canvasWidth + particle.size
      particle.history = []
    }
  }, [isMobile])

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const now = performance.now()
    frameCountRef.current++

    if (frameCountRef.current >= FPS_SAMPLE_SIZE) {
      const delta = now - lastTimeRef.current
      fpsRef.current = Math.round((FPS_SAMPLE_SIZE / delta) * 1000)
      frameCountRef.current = 0
      lastTimeRef.current = now

      if (adaptivePerformance && now - lastAdjustTimeRef.current > ADAPTIVE_COOLDOWN) {
        const currentFps = fpsRef.current
        const currentCount = particlesRef.current.length
        const targetCount = particleConfigRef.current.count || DEFAULT_DESKTOP_PARTICLES

        if (currentFps > 0 && currentFps < LOW_FPS_THRESHOLD) {
          if (lowFpsStartRef.current === 0) {
            lowFpsStartRef.current = now
          }
          highFpsStartRef.current = 0

          if (now - lowFpsStartRef.current >= LOW_FPS_DURATION && currentCount > MIN_PARTICLES) {
            const newCount = Math.max(MIN_PARTICLES, Math.floor(currentCount * REDUCE_RATIO))
            if (newCount < currentCount) {
              particlesRef.current = particlesRef.current.slice(0, newCount)
              currentAdaptiveCountRef.current = newCount
              isDegradedRef.current = true
              setPerformanceDegraded(true)
              lastAdjustTimeRef.current = now
            }
          }
        } else if (currentFps >= HIGH_FPS_THRESHOLD) {
          if (highFpsStartRef.current === 0) {
            highFpsStartRef.current = now
          }
          lowFpsStartRef.current = 0

          if (now - highFpsStartRef.current >= HIGH_FPS_DURATION && currentCount < targetCount) {
            const newCount = Math.min(targetCount, Math.floor(currentCount * INCREASE_RATIO))
            if (newCount > currentCount) {
              for (let i = currentCount; i < newCount; i++) {
                particlesRef.current.push(createParticle(canvas.width, canvas.height, particleConfigRef.current))
              }
              currentAdaptiveCountRef.current = newCount
              if (newCount >= targetCount) {
                isDegradedRef.current = false
              }
              lastAdjustTimeRef.current = now
            }
          }
        } else {
          lowFpsStartRef.current = 0
          highFpsStartRef.current = 0
        }
      }
    }

    const trailEnabled = particleConfigRef.current.trailEnabled === true
    const glowEnabled = particleConfigRef.current.glowEnabled !== false

    // 画布始终保持 100% 透明清除，绝不对整个全屏填充不透明矩形
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const sortedParticles = [...particlesRef.current].sort((a, b) => a.size - b.size)

    // 只要开启了运动轨迹，记录粒子过去坐标；未开启时清空历史
    particlesRef.current.forEach((particle) => {
      updateParticle(particle, canvas.width, canvas.height)
      if (trailEnabled) {
        if (!particle.history) particle.history = []
        particle.history.push({ x: particle.x, y: particle.y })
        if (particle.history.length > 8) {
          particle.history.shift()
        }
      } else if (particle.history && particle.history.length > 0) {
        particle.history = []
      }
    })

    // 每帧消费完毕瞬时滚动差量后清零，杜绝漂移
    scrollDeltaYRef.current = 0

    sortedParticles.forEach((particle) => {
      const shape = particleConfigRef.current.shape || 'circle'
      const color = getParticleColor(resolvedThemeRef.current, particleConfigRef.current.color, particle.opacity)
      const drawer = shapeDrawers[shape] || shapeDrawers.circle

      // 如果启用了运动轨迹，绘制粒子自身的渐隐拖尾线条，保持背景完全透明
      if (trailEnabled && particle.history && particle.history.length > 1) {
        ctx.save()
        for (let i = 0; i < particle.history.length - 1; i++) {
          const p1 = particle.history[i]
          const p2 = particle.history[i + 1]
          const trailAlpha = ((i + 1) / particle.history.length) * particle.opacity * 0.6
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.strokeStyle = replaceAlpha(color, trailAlpha.toString())
          ctx.lineWidth = Math.max(1, particle.size * 0.6)
          ctx.lineCap = 'round'
          ctx.stroke()
        }
        ctx.restore()
      }

      if (glowEnabled) {
        ctx.save()
        ctx.shadowColor = color
        ctx.shadowBlur = Math.max(4, particle.size * 1.5)
      } else {
        ctx.save()
        ctx.shadowBlur = 0
      }

      drawer(ctx, particle.x, particle.y, particle.size, particle.rotation, color, particle.opacity)

      ctx.restore()
    })

    animationFrameRef.current = requestAnimationFrame(loopFnRef.current!)
  }, [updateParticle, adaptivePerformance, setPerformanceDegraded])

  useEffect(() => {
    loopFnRef.current = animate
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !backgroundConfig.enabled || backgroundConfig.mode !== 'particles') {
      return
    }

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    canvas.style.display = 'block'

    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches
    }

    lastScrollYRef.current = window.scrollY

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      scrollDeltaYRef.current = currentScrollY - lastScrollYRef.current
      lastScrollYRef.current = currentScrollY
    }

    // 切后台 / 锁屏自动休眠与唤醒
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameRef.current)
      } else {
        lastTimeRef.current = performance.now()
        lastScrollYRef.current = window.scrollY
        scrollDeltaYRef.current = 0
        animationFrameRef.current = requestAnimationFrame(loopFnRef.current!)
      }
    }

    handleResize()

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    motionQuery.addEventListener('change', handleReducedMotionChange)
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll, { passive: true })
    document.addEventListener('visibilitychange', handleVisibilityChange)

    initParticles(canvas.width, canvas.height)

    lastTimeRef.current = performance.now()
    animationFrameRef.current = requestAnimationFrame(loopFnRef.current!)

    return () => {
      cancelAnimationFrame(animationFrameRef.current)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      motionQuery.removeEventListener('change', handleReducedMotionChange)
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
      particlesRef.current = []
      lowFpsStartRef.current = 0
      highFpsStartRef.current = 0
      currentAdaptiveCountRef.current = 0
      lastAdjustTimeRef.current = 0
      isDegradedRef.current = false
      setPerformanceDegraded(false)
    }
  }, [backgroundConfig.enabled, backgroundConfig.mode, initParticles])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || particlesRef.current.length === 0) return

    if (theme !== prevThemeRef.current) {
      prevThemeRef.current = theme
      canvas.style.transition = 'opacity 0.3s ease'
      canvas.style.opacity = '0'
      setTimeout(() => {
        canvas.style.opacity = '1'
      }, 300)
      return
    }

    particlesRef.current.forEach((particle) => {
      particle.opacity = 0.2 + Math.random() * Math.min(particleConfig.opacity - 0.2, 0.6)
    })
  }, [theme, particleConfig.opacity, particleConfig.color])

  useDeepCompareEffect(() => {
    const prev = prevConfigRef.current
    if (!prev) {
      prevConfigRef.current = particleConfig
      return
    }

    const particles = particlesRef.current
    if (particles.length === 0) {
      prevConfigRef.current = particleConfig
      return
    }

    const canvas = canvasRef.current
    if (!canvas) {
      prevConfigRef.current = particleConfig
      return
    }

    if (particleConfig.count !== prev.count) {
      const targetCount = isMobile
        ? Math.max(MIN_MOBILE_PARTICLES, Math.min(MAX_MOBILE_PARTICLES, Math.floor(canvas.width / 25)))
        : particleConfig.count || DEFAULT_DESKTOP_PARTICLES

      if (particles.length < targetCount) {
        for (let i = particles.length; i < targetCount; i++) {
          particles.push(createParticle(canvas.width, canvas.height, particleConfig))
        }
      } else if (particles.length > targetCount) {
        particlesRef.current = particles.slice(0, targetCount)
      }
    }

    if (particleConfig.minSpeed !== prev.minSpeed || particleConfig.maxSpeed !== prev.maxSpeed) {
      particles.forEach((particle) => {
        particle.targetSpeedY = particleConfig.minSpeed + Math.random() * (particleConfig.maxSpeed - particleConfig.minSpeed)
      })
    }

    if (particleConfig.minSize !== prev.minSize || particleConfig.maxSize !== prev.maxSize) {
      particles.forEach((particle) => {
        particle.targetSize = particleConfig.minSize + Math.random() * (particleConfig.maxSize - particleConfig.minSize)
      })
    }

    if (particleConfig.opacity !== prev.opacity) {
      particles.forEach((particle) => {
        particle.opacity = 0.2 + Math.random() * Math.min(particleConfig.opacity - 0.2, 0.6)
      })
    }

    prevConfigRef.current = particleConfig
  }, [particleConfig, isMobile])

  if (!backgroundConfig.enabled) {
    return <FallbackBackground />
  }

  if (backgroundConfig.mode === 'gradient') {
    return <GradientBackground />
  }

  if (backgroundConfig.mode === 'custom') {
    return <CustomBackground />
  }

  if (backgroundConfig.mode === 'none') {
    return <FallbackBackground />
  }

  if (backgroundConfig.mode !== 'particles') {
    return null
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 0,
        willChange: 'transform',
        transform: 'translateZ(0)'
      }}
      aria-hidden="true"
      role="presentation"
    />
  )
}

export default ParticleBackground
