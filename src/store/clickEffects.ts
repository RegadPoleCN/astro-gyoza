import { atom } from 'jotai'

const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined'

export type ClickEffectType = 'burst' | 'ripple' | 'sparkle' | 'bubble' | 'confetti' | 'firework'

export interface ClickEffectConfig {
  enabled: boolean
  type: ClickEffectType
  count: number
  size: number
  color: string
  life: number
  spread: number
  gravity: number
  fadeOut: boolean
  trailEnabled: boolean
}

const defaultClickEffectConfig: ClickEffectConfig = {
  enabled: true,
  type: 'burst',
  count: 12,
  size: 4,
  color: '',
  life: 1,
  spread: 1,
  gravity: 0.3,
  fadeOut: true,
  trailEnabled: false,
}

const clickEffectKey = 'gyoza-click-effect'

function parseClickEffectConfig(raw: string | null): ClickEffectConfig {
  if (!raw) return defaultClickEffectConfig
  try {
    const parsed = JSON.parse(raw) as Partial<ClickEffectConfig>
    return {
      enabled: parsed.enabled ?? defaultClickEffectConfig.enabled,
      type: parsed.type ?? defaultClickEffectConfig.type,
      count: parsed.count ?? defaultClickEffectConfig.count,
      size: parsed.size ?? defaultClickEffectConfig.size,
      color: parsed.color ?? defaultClickEffectConfig.color,
      life: parsed.life ?? defaultClickEffectConfig.life,
      spread: parsed.spread ?? defaultClickEffectConfig.spread,
      gravity: parsed.gravity ?? defaultClickEffectConfig.gravity,
      fadeOut: parsed.fadeOut ?? defaultClickEffectConfig.fadeOut,
      trailEnabled: parsed.trailEnabled ?? defaultClickEffectConfig.trailEnabled,
    }
  } catch {
    return defaultClickEffectConfig
  }
}

export function getLocalClickEffect(): ClickEffectConfig {
  if (!isBrowser) return defaultClickEffectConfig
  const local = localStorage.getItem(clickEffectKey)
  return parseClickEffectConfig(local)
}

export function setLocalClickEffect(config: ClickEffectConfig) {
  if (!isBrowser) return
  localStorage.setItem(clickEffectKey, JSON.stringify(config))
}

export const clickEffectAtom = atom<ClickEffectConfig>(getLocalClickEffect())

export const clickEffectEnabledAtom = atom(
  (get) => get(clickEffectAtom).enabled,
  (get, set, enabled: boolean) => {
    const next = { ...get(clickEffectAtom), enabled }
    set(clickEffectAtom, next)
    setLocalClickEffect(next)
  },
)

export const clickEffectTypeAtom = atom(
  (get) => get(clickEffectAtom).type,
  (get, set, type: ClickEffectType) => {
    const next = { ...get(clickEffectAtom), type }
    set(clickEffectAtom, next)
    setLocalClickEffect(next)
  },
)

export const clickEffectCountAtom = atom(
  (get) => get(clickEffectAtom).count,
  (get, set, count: number) => {
    const next = { ...get(clickEffectAtom), count }
    set(clickEffectAtom, next)
    setLocalClickEffect(next)
  },
)

export const clickEffectSizeAtom = atom(
  (get) => get(clickEffectAtom).size,
  (get, set, size: number) => {
    const next = { ...get(clickEffectAtom), size }
    set(clickEffectAtom, next)
    setLocalClickEffect(next)
  },
)

export const clickEffectColorAtom = atom(
  (get) => get(clickEffectAtom).color,
  (get, set, color: string) => {
    const next = { ...get(clickEffectAtom), color }
    set(clickEffectAtom, next)
    setLocalClickEffect(next)
  },
)

export const clickEffectLifeAtom = atom(
  (get) => get(clickEffectAtom).life,
  (get, set, life: number) => {
    const next = { ...get(clickEffectAtom), life }
    set(clickEffectAtom, next)
    setLocalClickEffect(next)
  },
)

export const clickEffectSpreadAtom = atom(
  (get) => get(clickEffectAtom).spread,
  (get, set, spread: number) => {
    const next = { ...get(clickEffectAtom), spread }
    set(clickEffectAtom, next)
    setLocalClickEffect(next)
  },
)

export const clickEffectGravityAtom = atom(
  (get) => get(clickEffectAtom).gravity,
  (get, set, gravity: number) => {
    const next = { ...get(clickEffectAtom), gravity }
    set(clickEffectAtom, next)
    setLocalClickEffect(next)
  },
)

export const clickEffectFadeOutAtom = atom(
  (get) => get(clickEffectAtom).fadeOut,
  (get, set, fadeOut: boolean) => {
    const next = { ...get(clickEffectAtom), fadeOut }
    set(clickEffectAtom, next)
    setLocalClickEffect(next)
  },
)

export const clickEffectTrailEnabledAtom = atom(
  (get) => get(clickEffectAtom).trailEnabled,
  (get, set, trailEnabled: boolean) => {
    const next = { ...get(clickEffectAtom), trailEnabled }
    set(clickEffectAtom, next)
    setLocalClickEffect(next)
  },
)

export function resetClickEffectConfig() {
  setLocalClickEffect(defaultClickEffectConfig)
  return defaultClickEffectConfig
}

export type { ClickEffectConfig as ClickEffectConfigType }
