import { useAtomValue } from 'jotai'
import { useEffect, useRef, useCallback } from 'react'
import { themeAtom } from '@/store/theme'
import { getSystemTheme } from '@/utils/theme'
import { useMediaQuery } from '@/hooks'

interface Particle {
  x: number
  y: number
  size: number
  speedY: number
  speedX: number
  opacity: number
  drift: number
  driftSpeed: number
  history?: Array<{ x: number; y: number }>
}

// 严格固化的粒子参数
const DESKTOP_PARTICLE_COUNT = 38
const MOBILE_PARTICLE_COUNT = 14
const MIN_SIZE = 2.5
const MAX_SIZE = 6.0
const MIN_SPEED = 0.4
const MAX_SPEED = 0.8
const DRIFT_AMPLITUDE = 0.3
const GLOW_BLUR = 6

function resolveTheme(theme: string): 'dark' | 'light' {
  if (theme === 'dark' || theme === 'light') return theme
  return getSystemTheme()
}

function getDispersedX(
  canvasWidth: number,
  existingParticles: Particle[],
  bucketCount: number,
): number {
  if (bucketCount <= 1 || existingParticles.length === 0) {
    return Math.random() * canvasWidth
  }
  const bucketWidth = canvasWidth / bucketCount
  const counts = new Array(bucketCount).fill(0)
  for (let i = 0; i < existingParticles.length; i++) {
    const idx = Math.min(
      bucketCount - 1,
      Math.max(0, Math.floor(existingParticles[i].x / bucketWidth)),
    )
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

function createLuminousParticle(
  canvasWidth: number,
  canvasHeight: number,
  initialX?: number,
  initialY?: number,
): Particle {
  const size = MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE)
  const speedY = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED)
  return {
    x: initialX !== undefined ? initialX : Math.random() * canvasWidth,
    y: initialY !== undefined ? initialY : Math.random() * canvasHeight,
    size,
    speedY,
    speedX: (Math.random() - 0.5) * 0.2,
    opacity: 0.35 + Math.random() * 0.45,
    drift: Math.random() * Math.PI * 2,
    driftSpeed: 0.01 + Math.random() * 0.015,
    history: [],
  }
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationFrameRef = useRef<number>(0)
  const loopFnRef = useRef<(() => void) | null>(null)
  const reducedMotionRef = useRef<boolean>(false)

  const scrollDeltaYRef = useRef(0)
  const lastScrollYRef = useRef(0)

  const theme = useAtomValue(themeAtom)
  const resolvedTheme = resolveTheme(theme)
  const resolvedThemeRef = useRef(resolvedTheme)
  resolvedThemeRef.current = resolvedTheme

  const isMobile = useMediaQuery('(max-width: 767px)')

  const initParticles = useCallback(
    (canvasWidth: number, canvasHeight: number) => {
      const count = isMobile ? MOBILE_PARTICLE_COUNT : DESKTOP_PARTICLE_COUNT
      const bucketCount = isMobile ? 6 : 18
      const particles: Particle[] = []
      for (let i = 0; i < count; i++) {
        const bucketIndex = i % bucketCount
        const bucketWidth = canvasWidth / bucketCount
        const initialX = bucketIndex * bucketWidth + Math.random() * bucketWidth
        const initialY = Math.random() * canvasHeight
        particles.push(createLuminousParticle(canvasWidth, canvasHeight, initialX, initialY))
      }
      particlesRef.current = particles
    },
    [isMobile],
  )

  const updateParticle = useCallback(
    (particle: Particle, canvasWidth: number, canvasHeight: number) => {
      if (reducedMotionRef.current) return

      // 桌面端内部分层视差响应（基于粒子大小比例模拟 Z 轴纵深），不改动 DOM Canvas
      let parallaxY = 0
      if (!isMobile && scrollDeltaYRef.current !== 0) {
        const depthRatio = Math.max(
          0,
          Math.min(1, (particle.size - MIN_SIZE) / (MAX_SIZE - MIN_SIZE)),
        )
        const parallaxSpeed = 0.02 + depthRatio * 0.05
        parallaxY = -scrollDeltaYRef.current * parallaxSpeed
      }

      particle.y += particle.speedY + parallaxY
      particle.drift += particle.driftSpeed
      particle.x += particle.speedX + Math.sin(particle.drift) * DRIFT_AMPLITUDE

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
    },
    [isMobile],
  )

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 画布始终保持 100% 透明清除，绝不对整个全屏填充不透明矩形
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const isDark = resolvedThemeRef.current === 'dark'
    // 亮色模式使用柔和暖金白，暗色模式使用清亮星光白
    const particleColor = isDark ? 'rgba(255, 255, 255, ' : 'rgba(255, 250, 240, '

    particlesRef.current.forEach((particle) => {
      updateParticle(particle, canvas.width, canvas.height)

      ctx.save()
      ctx.shadowColor = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(240, 220, 180, 0.7)'
      ctx.shadowBlur = GLOW_BLUR

      ctx.globalAlpha = particle.opacity
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size / 2, 0, Math.PI * 2)
      ctx.fillStyle = `${particleColor}${particle.opacity})`
      ctx.fill()
      ctx.restore()
    })

    // 每帧消费完毕瞬时滚动差量后清零，杜绝漂移
    scrollDeltaYRef.current = 0

    animationFrameRef.current = requestAnimationFrame(loopFnRef.current!)
  }, [updateParticle])

  useEffect(() => {
    loopFnRef.current = animate
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

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
    }
  }, [initParticles])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 0,
        mixBlendMode: 'screen',
        willChange: 'transform',
        transform: 'translateZ(0)',
      }}
      aria-hidden="true"
      role="presentation"
    />
  )
}

export default ParticleBackground
