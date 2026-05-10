import { useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { gradientConfigAtom, type GradientDirection } from '@/store/background'

const directionMap: Record<GradientDirection, string> = {
  'to-t': 'to top',
  'to-tr': 'to top right',
  'to-r': 'to right',
  'to-br': 'to bottom right',
  'to-b': 'to bottom',
  'to-bl': 'to bottom left',
  'to-l': 'to left',
  'to-tl': 'to top left',
}

export function GradientBackground() {
  const gradientConfig = useAtomValue(gradientConfigAtom)

  const gradientCSS = useMemo(() => {
    const colors = gradientConfig.colors.join(', ')
    if (gradientConfig.type === 'radial') {
      return `radial-gradient(circle, ${colors})`
    }
    if (gradientConfig.type === 'conic') {
      return `conic-gradient(from 0deg, ${colors})`
    }
    if (gradientConfig.type === 'mesh') {
      return `
        radial-gradient(circle at 20% 50%, ${gradientConfig.colors[0]} 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, ${gradientConfig.colors[1]} 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, ${gradientConfig.colors[2] || gradientConfig.colors[0]} 0%, transparent 50%)
      `.trim()
    }
    return `linear-gradient(${directionMap[gradientConfig.direction] || 'to bottom right'}, ${colors})`
  }, [gradientConfig])

  const animated = gradientConfig.animated && gradientConfig.animationSpeed > 0

  const bgSize = useMemo(() => {
    if (!animated) return undefined
    return `${200 + gradientConfig.animationSpeed * 20}% ${200 + gradientConfig.animationSpeed * 20}%`
  }, [animated, gradientConfig.animationSpeed])

  const animName = useMemo(() => {
    if (!animated) return undefined
    return `gradient-flow ${21 - gradientConfig.animationSpeed}s ease infinite`
  }, [animated, gradientConfig.animationSpeed])

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 0,
        opacity: gradientConfig.opacity,
        background: gradientCSS,
        ...(animated ? { backgroundSize: bgSize, animation: animName } : {}),
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: gradientConfig.opacity }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      aria-hidden="true"
      role="presentation"
    />
  )
}
