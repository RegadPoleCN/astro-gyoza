import { useEffect, useRef } from 'react'
import type { DependencyList, EffectCallback } from 'react'

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function useDeepCompareEffect(effect: EffectCallback, deps: DependencyList): void {
  const ref = useRef<DependencyList | undefined>(undefined)

  if (!ref.current || !deepEqual(deps, ref.current)) {
    ref.current = deps
  }

  useEffect(effect, ref.current)
}
