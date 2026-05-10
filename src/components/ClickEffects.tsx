import { useAtomValue } from 'jotai'
import { useEffect, useRef, useCallback } from 'react'
import { clickEffectAtom, type ClickEffectType } from '@/store/clickEffects'
import { themeAtom } from '@/store/theme'
import { getSystemTheme } from '@/utils/theme'

interface Particle {
  x: number
  y: number
  prevX: number
  prevY: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  rotation: number
  rotationSpeed: number
}

function resolveTheme(theme: string): 'dark' | 'light' {
  if (theme === 'dark' || theme === 'light') return theme
  return getSystemTheme()
}

function getDefaultColor(resolvedTheme: 'dark' | 'light', customColor: string): string {
  if (customColor) return customColor
  return resolvedTheme === 'dark' ? '#60a5fa' : '#3b82f6'
}

function createBurstParticles(
  x: number, y: number, count: number, size: number, color: string, life: number, spread: number
): Particle[] {
  const particles: Particle[] = []
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4
    const speed = size * 0.5 * spread + Math.random() * size * spread
    particles.push({
      x, y,
      prevX: x,
      prevY: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: life,
      maxLife: life,
      size: size * 0.4 + Math.random() * size * 0.6,
      color,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
    })
  }
  return particles
}

function createRippleParticles(
  x: number, y: number, count: number, size: number, color: string, life: number, spread: number
): Particle[] {
  const particles: Particle[] = []
  for (let i = 0; i < count; i++) {
    const dist = 10 * spread + i * (size * 3 * spread)
    const arcParticles = 3
    for (let j = 0; j < arcParticles; j++) {
      const angle = (j / arcParticles) * Math.PI * 2 + (i * 0.3)
      particles.push({
        x: x + Math.cos(angle) * dist * 0.2,
        y: y + Math.sin(angle) * dist * 0.2,
        prevX: x + Math.cos(angle) * dist * 0.2,
        prevY: y + Math.sin(angle) * dist * 0.2,
        vx: Math.cos(angle) * (1 + i * 0.6) * spread,
        vy: Math.sin(angle) * (1 + i * 0.6) * spread,
        life: life * (1 - i / count),
        maxLife: life,
        size: size * 0.5 + Math.random() * size * 0.5,
        color,
        rotation: 0,
        rotationSpeed: 0,
      })
    }
  }
  return particles
}

function createSparkleParticles(
  x: number, y: number, count: number, size: number, color: string, life: number, spread: number
): Particle[] {
  const particles: Particle[] = []
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = Math.random() * size * 5 * spread
    particles.push({
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      prevX: x + Math.cos(angle) * dist,
      prevY: y + Math.sin(angle) * dist,
      vx: (Math.random() - 0.5) * 0.3 * spread,
      vy: (Math.random() - 0.5) * 0.3 * spread - 0.5,
      life: life * (0.5 + Math.random() * 0.5),
      maxLife: life,
      size: size * 0.2 + Math.random() * size * 0.5,
      color: Math.random() > 0.5 ? color : '#ffd700',
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
    })
  }
  return particles
}

function createBubbleParticles(
  x: number, y: number, count: number, size: number, color: string, life: number, spread: number
): Particle[] {
  const particles: Particle[] = []
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = size * 0.3 * spread + Math.random() * size * 0.5 * spread
    particles.push({
      x, y,
      prevX: x,
      prevY: y,
      vx: Math.cos(angle) * speed * 0.3,
      vy: Math.sin(angle) * speed * 0.3 - speed,
      life: life,
      maxLife: life,
      size: size * 0.5 + Math.random() * size,
      color: color + '80',
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.05,
    })
  }
  return particles
}

function createConfettiParticles(
  x: number, y: number, count: number, size: number, color: string, life: number, spread: number
): Particle[] {
  const colors = ['#f87171', '#fb923c', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6']
  const particles: Particle[] = []
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = size * 0.5 * spread + Math.random() * size * spread
    particles.push({
      x, y,
      prevX: x,
      prevY: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - size * 0.3,
      life: life * (0.8 + Math.random() * 0.4),
      maxLife: life,
      size: size * 0.5 + Math.random() * size,
      color: color || colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
    })
  }
  return particles
}

function createFireworkParticles(
  x: number, y: number, count: number, size: number, color: string, life: number, spread: number
): Particle[] {
  const colors = color ? [color, color + 'cc', color + '88'] : ['#fbbf24', '#f87171', '#60a5fa', '#a78bfa', '#34d399']
  const particles: Particle[] = []
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.2
    const speed = size * spread + Math.random() * size * 1.5 * spread
    particles.push({
      x, y,
      prevX: x,
      prevY: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: life * (0.6 + Math.random() * 0.4),
      maxLife: life,
      size: size * 0.3 + Math.random() * size * 0.7,
      color: color || colors[Math.floor(Math.random() * colors.length)],
      rotation: 0,
      rotationSpeed: 0,
    })
  }
  return particles
}

type EffectCreator = (x: number, y: number, count: number, size: number, color: string, life: number, spread: number) => Particle[]

const effectCreators: Record<ClickEffectType, EffectCreator> = {
  burst: createBurstParticles,
  ripple: createRippleParticles,
  sparkle: createSparkleParticles,
  bubble: createBubbleParticles,
  confetti: createConfettiParticles,
  firework: createFireworkParticles,
}

export function ClickEffects() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>(0)
  const loopRef = useRef<(() => void) | null>(null)
  const configRef = useRef(useAtomValue(clickEffectAtom))
  const themeRef = useRef<'dark' | 'light'>(resolveTheme(useAtomValue(themeAtom)))

  const config = useAtomValue(clickEffectAtom)
  const theme = useAtomValue(themeAtom)

  configRef.current = config
  themeRef.current = resolveTheme(theme)

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const cfg = configRef.current
    const gravity = cfg.gravity
    const trailEnabled = cfg.trailEnabled

    particlesRef.current = particlesRef.current.filter(p => {
      p.prevX = p.x
      p.prevY = p.y
      p.x += p.vx
      p.y += p.vy
      p.vy += gravity * 0.3
      p.life -= 0.016
      p.rotation += p.rotationSpeed
      return p.life > 0
    })

    if (trailEnabled) {
      particlesRef.current.forEach(p => {
        const alpha = cfg.fadeOut ? Math.max(0, p.life / p.maxLife) * 0.3 : 0.3
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.beginPath()
        ctx.moveTo(p.prevX, p.prevY)
        ctx.lineTo(p.x, p.y)
        ctx.strokeStyle = p.color
        ctx.lineWidth = p.size * 0.6
        ctx.lineCap = 'round'
        ctx.stroke()
        ctx.restore()
      })
    }

    particlesRef.current.forEach(p => {
      const alpha = cfg.fadeOut ? Math.max(0, p.life / p.maxLife) : 1
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.beginPath()
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.fill()
      ctx.restore()
    })

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
      const cfg = configRef.current
      if (!cfg.enabled) return
      const color = getDefaultColor(themeRef.current, cfg.color)
      const creator = effectCreators[cfg.type] || effectCreators.burst
      const newParticles = creator(e.clientX, e.clientY, cfg.count, cfg.size, color, cfg.life, cfg.spread)
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
