import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  AnimatePresence,
  motion,
} from 'framer-motion'
import {
  backgroundAtom,
  backgroundModeAtom,
  particleConfigAtom,
  gradientConfigAtom,
  customConfigAtom,
  backgroundEnabledAtom,
  adaptivePerformanceAtom,
  performanceDegradedAtom,
  resetBackgroundConfig,
  type BackgroundMode,
  type ParticleConfig,
} from '@/store/background'
import {
  clickEffectAtom,
  resetClickEffectConfig,
} from '@/store/clickEffects'
import { ToggleSwitch } from './background/ToggleSwitch'
import { ParticleControls } from './background/ParticleControls'
import { GradientControls } from './background/GradientControls'
import { CustomControls } from './background/CustomControls'
import { ClickControls } from './background/ClickControls'

type Status = 'idle' | 'success' | 'error'

type PresetKey = 'snow' | 'starry' | 'sakura' | 'firefly' | 'autumn'

interface PresetConfig {
  label: string
  emoji: string
  config: Partial<ParticleConfig>
}

const presets: Record<PresetKey, PresetConfig> = {
  snow: {
    label: '冬日雪花',
    emoji: '❄️',
    config: {
      count: 80,
      minSize: 2,
      maxSize: 6,
      minSpeed: 0.3,
      maxSpeed: 1,
      opacity: 0.9,
      color: '#ffffff',
      shape: 'snowflake',
    },
  },
  starry: {
    label: '星空',
    emoji: '🌌',
    config: {
      count: 150,
      minSize: 1,
      maxSize: 3,
      minSpeed: 0.1,
      maxSpeed: 0.5,
      opacity: 0.8,
      shape: 'star',
    },
  },
  sakura: {
    label: '樱花花瓣',
    emoji: '🌸',
    config: {
      count: 60,
      minSize: 4,
      maxSize: 10,
      minSpeed: 1,
      maxSpeed: 2.5,
      opacity: 0.7,
      color: '#ffb7c5',
      shape: 'petal',
    },
  },
  firefly: {
    label: '萤火虫',
    emoji: '✨',
    config: {
      count: 30,
      minSize: 2,
      maxSize: 5,
      minSpeed: 0.8,
      maxSpeed: 2,
      opacity: 0.6,
      color: '#d4ff00',
      shape: 'circle',
    },
  },
  autumn: {
    label: '秋叶',
    emoji: '🍂',
    config: {
      count: 40,
      minSize: 5,
      maxSize: 12,
      minSpeed: 1.2,
      maxSpeed: 3,
      opacity: 0.85,
      color: '#d2691e',
      shape: 'petal',
    },
  },
}

const modeOptions: { value: BackgroundMode; label: string; emoji: string }[] = [
  { value: 'none', label: '无背景', emoji: '🚫' },
  { value: 'gradient', label: '渐变背景', emoji: '🎨' },
  { value: 'particles', label: '粒子飘落', emoji: '❄️' },
  { value: 'custom', label: '自定义', emoji: '✨' },
]

export function BackgroundConfig() {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const backgroundConfig = useAtomValue(backgroundAtom)
  const [mode, setMode] = useAtom(backgroundModeAtom)
  const [particleConfig, setParticleConfig] = useAtom(particleConfigAtom)
  const [gradientConfig, setGradientConfig] = useAtom(gradientConfigAtom)
  const [customConfig, setCustomConfig] = useAtom(customConfigAtom)
  const [enabled, setEnabled] = useAtom(backgroundEnabledAtom)
  const adaptivePerformance = useAtomValue(adaptivePerformanceAtom)
  const performanceDegraded = useAtomValue(performanceDegradedAtom)
  const setAdaptivePerformanceAtom = useSetAtom(adaptivePerformanceAtom)
  const clickEffectConfig = useAtomValue(clickEffectAtom)
  const setClickEffectAtom = useSetAtom(clickEffectAtom)

  const [exportStatus, setExportStatus] = useState<Status>('idle')
  const [importText, setImportText] = useState('')
  const [importStatus, setImportStatus] = useState<Status>('idle')
  const [importError, setImportError] = useState('')
  const [toast, setToast] = useState('')
  const [activeTab, setActiveTab] = useState<'background' | 'click'>('background')

  const showToast = useCallback((message: string) => {
    setToast(message)
    const timer = setTimeout(() => setToast(''), 2000)
    return () => clearTimeout(timer)
  }, [])

  const handleLongPressToggle = useCallback(() => {
    const newEnabled = !enabled
    setEnabled(newEnabled)
    showToast(newEnabled ? '🎨 背景已启用' : '🎨 背景已禁用')
  }, [enabled, setEnabled, showToast])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    triggerRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }
      if (e.key === 'b' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  const handleModeChange = useCallback(
    (newMode: BackgroundMode) => {
      setMode(newMode)
    },
    [setMode]
  )

  const handlePresetApply = useCallback(
    (presetKey: PresetKey) => {
      const preset = presets[presetKey]
      setParticleConfig(preset.config)
      if (mode !== 'particles') {
        setMode('particles')
      }
    },
    [mode, setMode, setParticleConfig]
  )

  const handleSliderChange = (
    key: keyof ParticleConfig,
    value: number | string | boolean
  ) => {
    setParticleConfig({ [key]: value })
  }

  const handleReset = useCallback(() => {
    const defaultBg = resetBackgroundConfig()
    setMode(defaultBg.mode)
    setParticleConfig(defaultBg.particles)
    setEnabled(defaultBg.enabled)
    setAdaptivePerformanceAtom(defaultBg.adaptivePerformance)
    const defaultClick = resetClickEffectConfig()
    setClickEffectAtom(defaultClick)
    showToast('🔄 已重置为默认配置')
  }, [setMode, setParticleConfig, setEnabled, setAdaptivePerformanceAtom, setClickEffectAtom, showToast])

  const handleExport = useCallback(async () => {
    try {
      const config = {
        background: { mode, particles: particleConfig, enabled },
        clickEffect: clickEffectConfig,
      }
      const json = JSON.stringify(config, null, 2)
      await navigator.clipboard.writeText(json)
      setExportStatus('success')
      showToast('✅ 配置已复制到剪贴板')
      setTimeout(() => setExportStatus('idle'), 2000)
    } catch {
      setExportStatus('error')
      setTimeout(() => setExportStatus('idle'), 2000)
    }
  }, [mode, particleConfig, enabled, clickEffectConfig, showToast])

  const handleImport = useCallback(() => {
    try {
      const parsed = JSON.parse(importText)

      let importedBg = false
      let importedClick = false

      if (parsed.background) {
        if (!parsed.background.mode || !['none', 'gradient', 'particles', 'custom'].includes(parsed.background.mode)) {
          throw new Error('无效的背景模式')
        }
        setMode(parsed.background.mode as BackgroundMode)
        if (parsed.background.particles && typeof parsed.background.particles === 'object') {
          setParticleConfig(parsed.background.particles)
        }
        if (typeof parsed.background.enabled === 'boolean') {
          setEnabled(parsed.background.enabled)
        }
        importedBg = true
      } else if (parsed.mode) {
        if (!['none', 'gradient', 'particles', 'custom'].includes(parsed.mode)) {
          throw new Error('无效的背景模式')
        }
        setMode(parsed.mode as BackgroundMode)
        if (parsed.particles && typeof parsed.particles === 'object') {
          setParticleConfig(parsed.particles)
        }
        if (typeof parsed.enabled === 'boolean') {
          setEnabled(parsed.enabled)
        }
        importedBg = true
      }

      if (parsed.clickEffect && typeof parsed.clickEffect === 'object') {
        setClickEffectAtom(parsed.clickEffect)
        importedClick = true
      }

      if (!importedBg && !importedClick) {
        throw new Error('未找到有效的背景或点击效果配置')
      }

      setImportStatus('success')
      setImportText('')
      setImportError('')
      showToast('✅ 配置导入成功')
      setTimeout(() => setImportStatus('idle'), 2000)
    } catch (e) {
      setImportStatus('error')
      setImportError(e instanceof Error ? e.message : '无效的 JSON 格式')
      setTimeout(() => setImportStatus('idle'), 5000)
    }
  }, [importText, setMode, setParticleConfig, setEnabled, setClickEffectAtom, showToast])

  return (
    <>
      <BackgroundConfigTrigger ref={triggerRef} onClick={() => setIsOpen(true)} onLongPress={handleLongPressToggle} />

      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed right-4 bottom-36 z-50 rounded-xl bg-zinc-900/80 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur dark:bg-zinc-100/80 dark:text-zinc-900"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center p-0 pb-[env(safe-area-inset-bottom,0px)] sm:items-center sm:justify-center sm:p-4 bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) handleClose()
            }}
          >
            <motion.div
              className="relative w-full max-w-lg max-h-[85vh] sm:max-h-[80vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl border-t sm:border border-zinc-200/30 bg-white/90 shadow-2xl backdrop-blur-2xl dark:border-zinc-700/40 dark:bg-zinc-900/90"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 移动端顶部下拉手柄 Handle */}
              <div className="flex sm:hidden justify-center pt-3 pb-1">
                <div className="h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              </div>

              <div className="flex items-center justify-between border-b border-zinc-200/20 px-5 py-3.5 dark:border-zinc-700/30 shrink-0">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center">
                  🎨 背景配置
                  <span className="ml-2 text-xs font-normal text-zinc-400 dark:text-zinc-500 hidden sm:inline">
                    Ctrl+B
                  </span>
                </h2>
                <button
                  className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  type="button"
                  aria-label="关闭配置面板"
                  onClick={handleClose}
                >
                  <svg
                    className="size-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="overflow-y-auto px-5 py-4 overscroll-contain flex-1">

                <div className="mb-4 flex gap-1 rounded-xl bg-zinc-200/60 p-1 dark:bg-zinc-800/60">
                  <button
                    type="button"
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 ${
                      activeTab === 'background'
                        ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
                        : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                    onClick={() => setActiveTab('background')}
                  >
                    🎨 背景
                  </button>
                  <button
                    type="button"
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 ${
                      activeTab === 'click'
                        ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
                        : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                    onClick={() => setActiveTab('click')}
                  >
                    ✨ 点击效果
                  </button>
                </div>

                {activeTab === 'background' ? (
                  <>
                <div className="mb-5 rounded-xl bg-zinc-100/60 px-4 py-3 dark:bg-zinc-800/60">
                  <ToggleSwitch
                    label="启用背景效果"
                    checked={enabled}
                    onChange={() => setEnabled(!enabled)}
                    ariaLabel="切换背景效果开关"
                  />
                </div>

                {enabled && (backgroundConfig.mode === 'particles' || backgroundConfig.mode === 'gradient' || backgroundConfig.mode === 'custom') && (
                  <div className="mb-5 space-y-2">
                    <div className="rounded-xl bg-zinc-100/60 px-4 py-3 dark:bg-zinc-800/60">
                      <ToggleSwitch
                        label="自适应性能"
                        checked={adaptivePerformance}
                        onChange={() => setAdaptivePerformanceAtom(!adaptivePerformance)}
                        ariaLabel="切换自适应性能开关"
                      />
                    </div>
                    <AnimatePresence>
                      {performanceDegraded && adaptivePerformance && (
                        <motion.div
                          className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 dark:bg-amber-900/20"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <span className="text-sm text-amber-700 dark:text-amber-400">
                            ⚠️ 性能优化中：已自动减少粒子数量以保持流畅度
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <section className="mb-5">
                  <h3 className="mb-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    背景模式
                  </h3>
                  <ModeSelector
                    currentMode={mode}
                    onModeChange={handleModeChange}
                    disabled={!enabled}
                  />
                </section>

                {enabled && mode === 'particles' && (
                  <section className="mb-5">
                    <h3 className="mb-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      粒子参数
                    </h3>
                    <ParticleControls
                      config={particleConfig}
                      onConfigChange={handleSliderChange}
                    />
                  </section>
                )}

                {enabled && mode === 'gradient' && (
                  <section className="mb-5">
                    <h3 className="mb-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      渐变配置
                    </h3>
                    <GradientControls
                      config={gradientConfig}
                      onConfigChange={setGradientConfig}
                    />
                  </section>
                )}

                {enabled && mode === 'custom' && (
                  <section className="mb-5">
                    <h3 className="mb-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      自定义配置
                    </h3>
                    <CustomControls
                      config={customConfig}
                      onConfigChange={setCustomConfig}
                    />
                  </section>
                )}

                {enabled && mode === 'particles' && (
                  <section className="mb-5">
                    <h3 className="mb-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      预设方案
                    </h3>
                    <PresetGrid onPresetApply={handlePresetApply} />
                  </section>
                )}
                  </>
                ) : (
                  <ClickControls />
                )}

                <div className="mt-5 border-t border-zinc-200/50 pt-5 dark:border-zinc-700/50">
                  <section className="mb-5">
                    <h3 className="mb-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      配置导入/导出
                    </h3>
                  <div className="space-y-2.5">
                    <button
                      className={`w-full rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                        exportStatus === 'success'
                          ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : exportStatus === 'error'
                            ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400'
                            : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-750'
                      }`}
                      type="button"
                      onClick={handleExport}
                    >
                      {exportStatus === 'success' ? '✅ 已复制到剪贴板' : exportStatus === 'error' ? '❌ 复制失败' : '📋 导出配置'}
                    </button>

                    <textarea
                      className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-xs font-mono text-zinc-700 placeholder-zinc-400 focus:border-primary focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:placeholder-zinc-500 dark:focus:border-primary"
                      rows={3}
                      placeholder="粘贴 JSON 配置..."
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                    />
                    <button
                      className={`w-full rounded-lg border px-4 py-2.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        importStatus === 'success'
                          ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : importStatus === 'error'
                            ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400'
                            : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-750'
                      }`}
                      type="button"
                      onClick={handleImport}
                      disabled={!importText.trim()}
                    >
                      {importStatus === 'success' ? '✅ 导入成功' : '📥 导入配置'}
                    </button>

                    {importError && (
                      <p className="text-xs text-red-500 dark:text-red-400">
                        ❌ {importError}
                      </p>
                    )}
                  </div>
                </section>
                </div>

                <div className="pt-2 pb-1">
                  <button
                    className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-red-500/50 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    onClick={handleReset}
                    type="button"
                  >
                    🔄 重置为默认配置
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

const BackgroundConfigTrigger = React.forwardRef<HTMLButtonElement, {
  onClick: () => void
  onLongPress?: () => void
}>(function BackgroundConfigTrigger({ onClick, onLongPress }, ref) {
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLongPressRef = useRef(false)
  const startPosRef = useRef({ x: 0, y: 0 })

  const handlePointerDown = (e: React.PointerEvent) => {
    isLongPressRef.current = false
    startPosRef.current = { x: e.clientX, y: e.clientY }
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        isLongPressRef.current = true
        onLongPress()
        if (navigator.vibrate) navigator.vibrate(50)
      }, 600)
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    // 若移动超过 10 像素则判定为页面滑动，取消长按
    const dx = Math.abs(e.clientX - startPosRef.current.x)
    const dy = Math.abs(e.clientY - startPosRef.current.y)
    if (dx > 10 || dy > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
    }
  }

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isLongPressRef.current) {
      onClick()
    }
    isLongPressRef.current = false
  }

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
    }
  }, [])

  return (
    <motion.button
      ref={ref}
      className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-40 flex size-12 items-center justify-center rounded-full border border-primary bg-white/50 shadow-lg shadow-zinc-800/5 backdrop-blur transition-shadow hover:shadow-xl dark:bg-zinc-800/50"
      type="button"
      aria-label="打开背景配置（长按快速切换）"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
    >
      <svg
        className="size-6 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
        />
      </svg>
    </motion.button>
  )
})

export { BackgroundConfigTrigger }

function ModeSelector({
  currentMode,
  onModeChange,
  disabled,
}: {
  currentMode: BackgroundMode
  onModeChange: (mode: BackgroundMode) => void
  disabled?: boolean
}) {
  return (
    <div
      className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      role="radiogroup"
      aria-label="选择背景模式"
    >
      {modeOptions.map((option) => (
        <button
          key={option.value}
          className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-sm transition-all duration-200 ${
            currentMode === option.value
              ? 'border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20'
              : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-sm active:scale-[0.97] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-750'
          } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
          type="button"
          role="radio"
          aria-checked={currentMode === option.value}
          disabled={disabled}
          onClick={() => !disabled && onModeChange(option.value)}
        >
          <span className="text-lg">{option.emoji}</span>
          <span className="text-xs">{option.label}</span>
        </button>
      ))}
    </div>
  )
}

function PresetGrid({
  onPresetApply,
}: {
  onPresetApply: (preset: PresetKey) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {(Object.keys(presets) as PresetKey[]).map((key) => {
        const preset = presets[key]
        return (
          <button
            key={key}
            className="group flex flex-col items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-3 transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm hover:scale-[1.03] active:scale-[0.97] dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-primary/50 dark:hover:bg-primary/5"
            type="button"
            aria-label={`应用${preset.label}预设`}
            onClick={() => onPresetApply(key)}
          >
            <span className="text-xl transition-transform duration-200 group-hover:scale-110">
              {preset.emoji}
            </span>
            <span className="text-xs text-zinc-600 transition-colors duration-200 group-hover:text-primary dark:text-zinc-400">
              {preset.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
