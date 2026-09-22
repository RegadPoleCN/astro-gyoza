import { useEffect, useRef, useState, useCallback, lazy, Suspense } from 'react'
import { createPortal } from 'react-dom'
import { useAtomValue } from 'jotai'
import { themeAtom } from '@/store/theme'
import { useDebounceValue } from '@/hooks/useDebounceValue'

const MermaidRenderer = lazy(() => import('./MermaidRenderer'))

interface MermaidTarget {
  id: string
  code: string
  element: HTMLElement
}

const THEME_DEBOUNCE_DELAY = 150
const SCAN_DELAY_MS = 50
const SWUP_RESCAN_DELAY_MS = 100

function isMermaidElement(node: Node): boolean {
  if (!(node instanceof HTMLElement)) return false
  if (node.getAttribute('data-mermaid') === 'true') return true
  return node.querySelector('[data-mermaid="true"]') !== null
}

function collectMermaidElements(): MermaidTarget[] {
  const elements = document.querySelectorAll<HTMLElement>('[data-mermaid="true"]')
  const targets: MermaidTarget[] = []

  elements.forEach((el) => {
    if (!el.hasAttribute('data-initialized')) {
      targets.push({
        id: `mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        code: el.getAttribute('data-code') || '',
        element: el,
      })
      el.setAttribute('data-initialized', 'true')
    }
  })

  return targets
}

const MermaidInitializer = () => {
  const [targets, setTargets] = useState<MermaidTarget[]>([])
  const observerRef = useRef<MutationObserver | null>(null)
  const rawTheme = useAtomValue(themeAtom)
  const debouncedTheme = useDebounceValue(rawTheme, THEME_DEBOUNCE_DELAY)
  const currentTheme = debouncedTheme === 'dark' ? 'dark' : 'light'

  const scan = useCallback(() => {
    const newTargets = collectMermaidElements()
    if (newTargets.length > 0) {
      setTargets((prev) => [...prev, ...newTargets])
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(scan, SCAN_DELAY_MS)
    return () => clearTimeout(timer)
  }, [scan])

  useEffect(() => {
    const targetNode = document.querySelector('main') || document.body
    if (!targetNode) return

    observerRef.current = new MutationObserver((mutations) => {
      const hasChanges = mutations.some((m) => Array.from(m.addedNodes).some(isMermaidElement))
      if (hasChanges) scan()
    })

    observerRef.current.observe(targetNode, { childList: true, subtree: true })
    return () => observerRef.current?.disconnect()
  }, [scan])

  useEffect(() => {
    const handler = () => {
      document.querySelectorAll('[data-mermaid="true"]').forEach((el) => {
        el.removeAttribute('data-initialized')
      })
      setTargets([])
      setTimeout(scan, SWUP_RESCAN_DELAY_MS)
    }

    document.addEventListener('swup:content:replaced', handler)
    return () => document.removeEventListener('swup:content:replaced', handler)
  }, [scan])

  if (targets.length === 0) return null

  return (
    <Suspense fallback={null}>
      {targets.map((target) =>
        createPortal(
          <MermaidRenderer
            key={target.id}
            code={target.code}
            theme={currentTheme}
          />,
          target.element,
        ),
      )}
    </Suspense>
  )
}

export default MermaidInitializer
