import { atom } from 'jotai'

const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined'

export type BackgroundMode = 'none' | 'gradient' | 'particles' | 'custom'

export type ParticleShape = 'circle' | 'snowflake' | 'heart' | 'star' | 'bubble' | 'petal'

export interface ParticleConfig {
  count: number
  minSize: number
  maxSize: number
  minSpeed: number
  maxSpeed: number
  opacity: number
  color?: string
  shape?: ParticleShape
  driftAmplitude?: number
  rotationSpeed?: number
  glowEnabled?: boolean
  trailEnabled?: boolean
}

export type GradientType = 'linear' | 'radial' | 'conic' | 'mesh'
export type GradientDirection =
  | 'to-t'
  | 'to-tr'
  | 'to-r'
  | 'to-br'
  | 'to-b'
  | 'to-bl'
  | 'to-l'
  | 'to-tl'
export type CustomType = 'solid' | 'gradient' | 'css'

export interface GradientConfig {
  type: GradientType
  direction: GradientDirection
  colors: string[]
  animated: boolean
  animationSpeed: number
  opacity: number
}

export interface CustomConfig {
  type: CustomType
  color?: string
  colors?: string[]
  css?: string
}

export interface BackgroundConfig {
  mode: BackgroundMode
  particles: ParticleConfig
  gradient: GradientConfig
  custom: CustomConfig
  enabled: boolean
  adaptivePerformance: boolean
}

const defaultGradientConfig: GradientConfig = {
  type: 'linear',
  direction: 'to-br',
  colors: ['#667eea', '#764ba2'],
  animated: true,
  animationSpeed: 5,
  opacity: 1,
}

const defaultCustomConfig: CustomConfig = {
  type: 'solid',
  color: '#1a1a2e',
  css: '',
}

const defaultParticleConfig: ParticleConfig = {
  count: 100,
  minSize: 3,
  maxSize: 8,
  minSpeed: 0.8,
  maxSpeed: 3,
  opacity: 0.8,
  shape: 'circle',
  driftAmplitude: 0.5,
  rotationSpeed: 1.0,
  glowEnabled: true,
  trailEnabled: false,
}

const defaultBackgroundConfig: BackgroundConfig = {
  mode: 'particles',
  particles: defaultParticleConfig,
  gradient: defaultGradientConfig,
  custom: defaultCustomConfig,
  enabled: true,
  adaptivePerformance: true,
}

const backgroundKey = 'gyoza-background'

function parseBackgroundConfig(raw: string | null): BackgroundConfig {
  if (!raw) return defaultBackgroundConfig
  try {
    const parsed = JSON.parse(raw) as Partial<BackgroundConfig>
    return {
      mode: parsed.mode ?? defaultBackgroundConfig.mode,
      enabled: parsed.enabled ?? defaultBackgroundConfig.enabled,
      adaptivePerformance: parsed.adaptivePerformance ?? true,
      particles: {
        count: parsed.particles?.count ?? defaultParticleConfig.count,
        minSize: parsed.particles?.minSize ?? defaultParticleConfig.minSize,
        maxSize: parsed.particles?.maxSize ?? defaultParticleConfig.maxSize,
        minSpeed: parsed.particles?.minSpeed ?? defaultParticleConfig.minSpeed,
        maxSpeed: parsed.particles?.maxSpeed ?? defaultParticleConfig.maxSpeed,
        opacity: parsed.particles?.opacity ?? defaultParticleConfig.opacity,
        color: parsed.particles?.color,
        shape: parsed.particles?.shape ?? defaultParticleConfig.shape,
        driftAmplitude: parsed.particles?.driftAmplitude ?? defaultParticleConfig.driftAmplitude,
        rotationSpeed: parsed.particles?.rotationSpeed ?? defaultParticleConfig.rotationSpeed,
        glowEnabled: parsed.particles?.glowEnabled ?? defaultParticleConfig.glowEnabled,
        trailEnabled: parsed.particles?.trailEnabled ?? defaultParticleConfig.trailEnabled,
      },
      gradient: {
        type: parsed.gradient?.type ?? defaultGradientConfig.type,
        direction: parsed.gradient?.direction ?? defaultGradientConfig.direction,
        colors: parsed.gradient?.colors ?? defaultGradientConfig.colors,
        animated: parsed.gradient?.animated ?? defaultGradientConfig.animated,
        animationSpeed: parsed.gradient?.animationSpeed ?? defaultGradientConfig.animationSpeed,
        opacity: parsed.gradient?.opacity ?? defaultGradientConfig.opacity,
      },
      custom: {
        type: parsed.custom?.type ?? defaultCustomConfig.type,
        color: parsed.custom?.color ?? defaultCustomConfig.color,
        colors: parsed.custom?.colors,
        css: parsed.custom?.css ?? defaultCustomConfig.css,
      },
    }
  } catch {
    return defaultBackgroundConfig
  }
}

export function getLocalBackground(): BackgroundConfig {
  if (!isBrowser) return defaultBackgroundConfig
  const local = localStorage.getItem(backgroundKey)
  return parseBackgroundConfig(local)
}

export function setLocalBackground(config: BackgroundConfig) {
  if (!isBrowser) return
  localStorage.setItem(backgroundKey, JSON.stringify(config))
}

export const backgroundAtom = atom<BackgroundConfig>(getLocalBackground())

function createPersistedSliceAtom<T, V>(
  selector: (c: BackgroundConfig) => T,
  merger: (c: BackgroundConfig, v: V) => BackgroundConfig,
) {
  return atom(
    (get) => selector(get(backgroundAtom)),
    (get, set, value: V) => {
      const current = get(backgroundAtom)
      const next = merger(current, value)
      set(backgroundAtom, next)
      setLocalBackground(next)
    },
  )
}

export const backgroundModeAtom = createPersistedSliceAtom(
  (c) => c.mode,
  (c, mode: BackgroundMode) => ({ ...c, mode }),
)

export const particleConfigAtom = createPersistedSliceAtom(
  (c) => c.particles,
  (c, particles: Partial<ParticleConfig>) => ({
    ...c,
    particles: { ...c.particles, ...particles },
  }),
)

export const backgroundEnabledAtom = createPersistedSliceAtom(
  (c) => c.enabled,
  (c, enabled: boolean) => ({ ...c, enabled }),
)

export const adaptivePerformanceAtom = createPersistedSliceAtom(
  (c) => c.adaptivePerformance,
  (c, value: boolean) => ({ ...c, adaptivePerformance: value }),
)

export const gradientConfigAtom = createPersistedSliceAtom(
  (c) => c.gradient,
  (c, gradient: Partial<GradientConfig>) => ({ ...c, gradient: { ...c.gradient, ...gradient } }),
)

export const customConfigAtom = createPersistedSliceAtom(
  (c) => c.custom,
  (c, custom: Partial<CustomConfig>) => ({ ...c, custom: { ...c.custom, ...custom } }),
)

export const performanceDegradedAtom = atom<boolean>(false)

export function resetBackgroundConfig() {
  setLocalBackground(defaultBackgroundConfig)
  return defaultBackgroundConfig
}
