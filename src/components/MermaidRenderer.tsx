import { useEffect, useRef, useState, useCallback, useMemo } from 'react'

interface MermaidRendererProps {
  code: string
  theme?: 'light' | 'dark'
  shouldRender?: boolean
}

type RenderStatus = 'idle' | 'loading' | 'success' | 'error'
type SizePreset = 'sm' | 'md' | 'lg' | 'xl' | 'full'

const SIZE_CONFIG: Record<SizePreset, { label: string; maxWidth: string }> = {
  sm: { label: 'S', maxWidth: '400px' },
  md: { label: 'M', maxWidth: '600px' },
  lg: { label: 'L', maxWidth: '800px' },
  xl: { label: 'XL', maxWidth: '1000px' },
  full: { label: '全屏', maxWidth: '100%' },
}

function generateId() {
  return `mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function buildMermaidConfig(isDark: boolean) {
  return {
    startOnLoad: false,
    theme: isDark ? 'dark' : 'default',
    themeVariables: {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans SC", sans-serif',
      cScale0: isDark ? '#f0b840' : '#e85347',
      cScale1: isDark ? '#78b8d8' : '#5b8fb8',
      cScale2: isDark ? '#5cb878' : '#509a68',
      cScale3: isDark ? '#dfb548' : '#c89838',
      cScale4: isDark ? '#b893d6' : '#8b6bab',
      cScale5: isDark ? '#5cc4b8' : '#489e94',
      cScale6: isDark ? '#e87868' : '#d47868',
      cScale7: isDark ? '#a0a8d6' : '#6b7dab',
      cScaleLabel0: '#ffffff',
      cScaleLabel1: '#ffffff',
      cScaleLabel2: '#ffffff',
      cScaleLabel3: '#ffffff',
      cScaleLabel4: '#ffffff',
      cScaleLabel5: '#ffffff',
      cScaleLabel6: '#ffffff',
      cScaleLabel7: '#ffffff',
    },
    securityLevel: 'loose' as const,
    logLevel: 'error' as const,
    flowchart: {
      htmlLabels: true,
      curve: 'basis' as const,
      padding: 25,
      nodeSpacing: 60,
      rankSpacing: 70,
      useMaxWidth: false,
    },
    sequence: {
      useMaxWidth: false,
      actorMargin: 60,
      boxMargin: 15,
      messageMargin: 40,
      mirrorActors: true,
      bottomMarginAdj: 2,
    },
    gantt: {
      useMaxWidth: false,
      leftPadding: 75,
      rightPadding: 25,
      fontSize: 15,
      topPadding: 15,
      barHeight: 20,
      sectionFontSize: 15,
      numberSectionStyles: 3,
    },
    class: { useMaxWidth: false, dividerMargin: 15, padding: 10 },
    state: {
      useMaxWidth: false,
      dividerMargin: 15,
      sizeUnit: 5,
      padding: 10,
      textHeight: 15,
      titleShift: 15,
      noteMargin: 10,
      forkWidth: 70,
      forkHeight: 7,
      fontSize: 15,
    },
    pie: { useMaxWidth: false, textPosition: 0.55 },
    er: {
      useMaxWidth: false,
      diagramPadding: 15,
      entityPadding: 15,
      fontSize: 15,
    },
    journey: {
      useMaxWidth: false,
      diagramMarginX: 25,
      diagramMarginY: 25,
      taskMargin: 25,
    },
    mindmap: { useMaxWidth: false, padding: 15, maxNodeWidth: 200 },
    timeline: { useMaxWidth: false, padding: 25 },
    gitGraph: {
      useMaxWidth: false,
      mainBranchName: 'main',
      mainBranchOrder: 1,
      showBranches: true,
      rotateCommitLabel: true,
    },
  } as const
}

function MermaidRenderer({ code, theme = 'light', shouldRender = true }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<RenderStatus>('idle')
  const [error, setError] = useState<string>('')
  const [svgContent, setSvgContent] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [scale, setScale] = useState(1)
  const [size, setSize] = useState<SizePreset>('lg')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const dragStart = useRef({ x: 0, y: 0 })

  const diagramId = useMemo(() => generateId(), [])

  const renderChart = useCallback(async () => {
    try {
      setStatus('loading')
      setError('')
      setSvgContent('')
      setIsVisible(false)

      const mermaidModule = await import('mermaid')
      const mermaid = mermaidModule.default || mermaidModule

      if (!mermaid?.initialize) {
        throw new Error('Mermaid 模块加载失败')
      }

      const isDark = theme === 'dark'

      const config = buildMermaidConfig(isDark)
      mermaid.initialize(config)

      const { svg } = await mermaid.render(diagramId, code)
      setSvgContent(svg)
      setStatus('success')

      setTimeout(() => setIsVisible(true), 50)

      const tempEl = document.getElementById(diagramId)
      if (tempEl?.parentNode) {
        tempEl.parentNode.removeChild(tempEl)
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(String(err))
      }
      setStatus('error')
    }
  }, [code, theme, diagramId])

  useEffect(() => {
    if (!shouldRender || !code.trim()) {
      setStatus('idle')
      return
    }

    let isMounted = true

    renderChart().then(() => {
      if (!isMounted) return
    })

    return () => {
      isMounted = false
    }
  }, [code, theme, shouldRender, renderChart])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [code])

  const handleRetry = useCallback(() => {
    renderChart()
  }, [renderChart])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setScale((s) => Math.max(0.3, Math.min(5, s + delta)))
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (scale > 1) {
        setIsDragging(true)
        dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y }
      }
    },
    [scale, position],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.current.x,
          y: e.clientY - dragStart.current.y,
        })
      }
    },
    [isDragging],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const currentSize = SIZE_CONFIG[size]

  if (!shouldRender || status === 'idle') {
    return (
      <div
        ref={containerRef}
        className="mermaid-container my-4 rounded-lg bg-gray-100 dark:bg-gray-800/50 h-48 flex items-center justify-center"
      >
        <span className="text-sm text-gray-400 dark:text-gray-500">图表待加载</span>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div
        ref={containerRef}
        className="mermaid-container my-4 rounded-lg bg-gray-100 dark:bg-gray-800/50 h-48 flex flex-col items-center justify-center gap-2"
      >
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:150ms]" />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
        <span className="text-xs text-gray-500">正在渲染图表...</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div
        ref={containerRef}
        className="mermaid-container my-4 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-orange-600 dark:bg-orange-900/20"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-red-800 dark:text-orange-200">⚠️ 图表渲染失败</p>
            <p className="mt-1 text-sm text-red-600 dark:text-orange-300">{error}</p>
          </div>
          <button
            onClick={handleRetry}
            className="ml-4 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 dark:bg-orange-600 dark:hover:bg-orange-700"
          >
            重试
          </button>
        </div>
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-red-700 hover:text-red-900 dark:text-orange-300 dark:hover:text-orange-100">
            查看源码
          </summary>
          <pre className="mt-2 overflow-x-auto rounded bg-white/80 p-3 text-xs text-gray-700 dark:bg-gray-800/80 dark:text-gray-200">
            <code>{code}</code>
          </pre>
        </details>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`mermaid-container group relative my-4 rounded-lg transition-all duration-300 ${
        isExpanded ? 'fixed inset-4 z-50' : ''
      }`}
    >
      <div
        className={`flex items-start justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 ${
          isExpanded ? 'bg-gray-50 dark:bg-gray-900' : 'bg-gray-50/80 dark:bg-gray-800/80'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Mermaid 图表</span>
          <div className="flex items-center gap-1 ml-2">
            {(Object.keys(SIZE_CONFIG) as SizePreset[]).map((sizeKey) => (
              <button
                key={sizeKey}
                onClick={() => {
                  setSize(sizeKey)
                  setScale(1)
                  setPosition({ x: 0, y: 0 })
                }}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  size === sizeKey
                    ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {SIZE_CONFIG[sizeKey].label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setIsExpanded(!isExpanded)
              setScale(1)
              setPosition({ x: 0, y: 0 })
            }}
            className="px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {isExpanded ? '退出全屏' : '全屏'}
          </button>
          <button
            onClick={handleCopy}
            className="px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {copied ? '✓ 已复制' : '复制'}
          </button>
        </div>
      </div>

      <div
        ref={svgContainerRef}
        className={`mermaid-svg overflow-auto transition-all duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        } ${isDragging ? 'cursor-grabbing' : scale > 1 ? 'cursor-grab' : ''}`}
        style={{
          maxWidth: isExpanded ? '100%' : currentSize.maxWidth,
          margin: '0 auto',
          padding: '1.5rem',
          minHeight: '200px',
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'top center',
            transition: isDragging ? 'none' : 'transform 0.15s ease',
          }}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>

      {scale !== 1 && (
        <button
          onClick={() => {
            setScale(1)
            setPosition({ x: 0, y: 0 })
          }}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-10 px-3 py-1 text-xs rounded-full bg-gray-800/90 text-white hover:bg-gray-900 dark:bg-gray-200/90 dark:text-gray-900 dark:hover:bg-gray-100 shadow-sm transition-opacity opacity-0 group-hover:opacity-100"
        >
          重置缩放
        </button>
      )}

      <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-gray-800/90 rounded-md p-1 shadow-sm">
        <button
          onClick={() => setScale((s) => Math.max(0.3, s - 0.1))}
          className="flex h-7 w-7 items-center justify-center rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          −
        </button>
        <span className="rounded px-2 py-1 text-xs font-mono w-14 text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale((s) => Math.min(5, s + 0.1))}
          className="flex h-7 w-7 items-center justify-center rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          +
        </button>
        <button
          onClick={() => {
            setScale(1)
            setPosition({ x: 0, y: 0 })
          }}
          className="flex h-7 w-7 items-center justify-center rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          ↺
        </button>
      </div>

      {scale > 1.5 && (
        <div className="absolute bottom-2 left-2 z-10 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
          拖动平移
        </div>
      )}
    </div>
  )
}

export default MermaidRenderer
