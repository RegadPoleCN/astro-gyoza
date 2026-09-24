import { useAtomValue } from 'jotai'
import { useEffect, useRef, useCallback } from 'react'
import { themeAtom } from '@/store/theme'
import { getSystemTheme } from '@/utils/theme'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  rotation: number
  rotationSpeed: number
}

// 严格固化的点击星芒特效参数
const PARTICLE_COUNT = 10
const PARTICLE_SIZE = 3.5
const SPREAD_RADIUS = 45
const PARTICLE_LIFE = 0.55 // 秒

function resolveTheme(theme: string): 'dark' | 'light' {
  if (theme === 'dark' || theme === 'light') return theme
  return getSystemTheme()
}

function getThemeAccentColor(resolvedTheme: 'dark' | 'light'): string {
  // 提取当前站点的强调色；深色偏暖金星光，浅色偏清亮青蓝
  return resolvedTheme === 'dark' ? '#fcd34d' : '#38bdf8'
}

function createSparkleParticles(x: number, y: number, color: string): Particle[] {
  const particles: Particle[] = []
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = Math.random() * SPREAD_RADIUS
    const particleColor = Math.random() > 0.4 ? color : '#ffffff'
    particles.push({
      x: x + Math.cos(angle) * (dist * 0.3),
      y: y + Math.sin(angle) * (dist * 0.3),
      vx: Math.cos(angle) * (Math.random() * 1.5 + 0.5),
      vy: Math.sin(angle) * (Math.random() * 1.5 + 0.5) - 0.4,
      life: PARTICLE_LIFE * (0.6 + Math.random() * 0.4),
      maxLife: PARTICLE_LIFE,
      size: PARTICLE_SIZE * (0.6 + Math.random() * 0.6),
      color: particleColor,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
    })
  }
  return particles
}

export function ClickEffects() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>(0)
  const loopRef = useRef<(() => void) | null>(null)
  const theme = useAtomValue(themeAtom)
  const themeRef = useRef(resolveTheme(theme))

  useEffect(() => {
    themeRef.current = resolveTheme(theme)
  }, [theme])

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const particles = particlesRef.current

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.life -= 1 / 60
      if (p.life <= 0) {
        particles.splice(i, 1)
        continue
      }

      p.x += p.vx
      p.y += p.vy
      p.vy += 0.05 // 轻微重力
      p.vx *= 0.98 // 轻微阻尼
      p.rotation += p.rotationSpeed

      const alpha = Math.max(0, p.life / p.maxLife)

      ctx.save()
      ctx.globalAlpha = alpha
      ctx.shadowColor = p.color
      ctx.shadowBlur = 4
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)

      // 绘制 4 角星芒
      const r = p.size
      ctx.beginPath()
      ctx.moveTo(0, -r)
      ctx.quadraticCurveTo(0, 0, r, 0)
      ctx.quadraticCurveTo(0, 0, 0, r)
      ctx.quadraticCurveTo(0, 0, -r, 0)
      ctx.quadraticCurveTo(0, 0, 0, -r)
      ctx.fillStyle = p.color
      ctx.fill()
      ctx.restore()
    }

    animationRef.current = requestAnimationFrame(loopRef.current!)
  }, [])

  useEffect(() => {
    loopRef.current = animate
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const handleClick = (e: MouseEvent) => {
      const color = getThemeAccentColor(themeRef.current)
      const newParticles = createSparkleParticles(e.clientX, e.clientY, color)
      particlesRef.current.push(...newParticles)
    }

    window.addEventListener('resize', handleResize)
    document.addEventListener('click', handleClick)

    animationRef.current = requestAnimationFrame(loopRef.current!)

    return () => {
      cancelAnimationFrame(animationRef.current)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('click', handleClick)
      particlesRef.current = []
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 100 }}
      aria-hidden="true"
      role="presentation"
    />
  )
}

export default ClickEffects
