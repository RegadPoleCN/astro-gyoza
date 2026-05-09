import { useRef, useState, useCallback, useEffect } from 'react'

interface TouchState {
  startX: number
  startY: number
  lastX: number
  lastY: number
  initialDistance: number
  initialScale: number
}

interface UseTouchGesturesOptions {
  minScale?: number
  maxScale?: number
  scaleStep?: number
}

interface UseTouchGesturesReturn {
  scale: number
  panX: number
  panY: number
  containerRef: React.RefObject<HTMLDivElement | null>
  handleTouchStart: (e: React.TouchEvent) => void
  handleTouchMove: (e: React.TouchEvent) => void
  handleTouchEnd: () => void
  zoomIn: () => void
  zoomOut: () => void
  resetView: () => void
}

export function useTouchGestures(options: UseTouchGesturesOptions = {}): UseTouchGesturesReturn {
  const { minScale = 0.5, maxScale = 3, scaleStep = 0.25 } = options

  const [scale, setScale] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchState = useRef<TouchState>({
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    initialDistance: 0,
    initialScale: 1,
  })
  const isPinching = useRef(false)
  const animationFrameRef = useRef<number>()

  const getTouchDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        touchState.current.startX = e.touches[0].clientX - panX
        touchState.current.startY = e.touches[0].clientY - panY
        touchState.current.lastX = e.touches[0].clientX
        touchState.current.lastY = e.touches[0].clientY
        isPinching.current = false
      } else if (e.touches.length === 2) {
        isPinching.current = true
        touchState.current.initialDistance = getTouchDistance(e.touches)
        touchState.current.initialScale = scale
      }
    },
    [panX, panY, scale],
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        if (e.touches.length === 1 && !isPinching.current) {
          const deltaX = e.touches[0].clientX - touchState.current.lastX
          const deltaY = e.touches[0].clientY - touchState.current.lastY

          setPanX((prev) => prev + deltaX)
          setPanY((prev) => prev + deltaY)

          touchState.current.lastX = e.touches[0].clientX
          touchState.current.lastY = e.touches[0].clientY
        } else if (e.touches.length === 2) {
          const currentDistance = getTouchDistance(e.touches)
          if (touchState.current.initialDistance > 0) {
            const newScale = Math.min(
              maxScale,
              Math.max(
                minScale,
                touchState.current.initialScale *
                  (currentDistance / touchState.current.initialDistance),
              ),
            )
            setScale(newScale)
          }
        }
      })
    },
    [minScale, maxScale],
  )

  const handleTouchEnd = useCallback(() => {
    isPinching.current = false
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + scaleStep, maxScale))
  }, [maxScale, scaleStep])

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - scaleStep, minScale))
  }, [minScale, scaleStep])

  const resetView = useCallback(() => {
    setScale(1)
    setPanX(0)
    setPanY(0)
  }, [])

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return {
    scale,
    panX,
    panY,
    containerRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    zoomIn,
    zoomOut,
    resetView,
  }
}
