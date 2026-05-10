import { SliderControl } from './SliderControl'
import { ToggleSwitch } from './ToggleSwitch'
import { SelectableButton } from './SelectableButton'
import type { GradientConfig, GradientType, GradientDirection } from '@/store/background'

const gradientTypeOptions: { value: GradientType; label: string; emoji: string }[] = [
  { value: 'linear', label: '线性', emoji: '📏' },
  { value: 'radial', label: '径向', emoji: '🔵' },
  { value: 'conic', label: '锥形', emoji: '🌀' },
  { value: 'mesh', label: '网格', emoji: '🔲' },
]

const directionOptions: { value: GradientDirection; label: string }[] = [
  { value: 'to-t', label: '↑ 上' },
  { value: 'to-tr', label: '↗ 右上' },
  { value: 'to-r', label: '→ 右' },
  { value: 'to-br', label: '↘ 右下' },
  { value: 'to-b', label: '↓ 下' },
  { value: 'to-bl', label: '↙ 左下' },
  { value: 'to-l', label: '← 左' },
  { value: 'to-tl', label: '↖ 左上' },
]

const presetGradients: { label: string; colors: string[] }[] = [
  { label: '蓝紫渐变', colors: ['#667eea', '#764ba2'] },
  { label: '日落橙色', colors: ['#f093fb', '#f5576c'] },
  { label: '深海蓝绿', colors: ['#4facfe', '#00f2fe'] },
  { label: '薄荷清新', colors: ['#43e97b', '#38f9d7'] },
  { label: '暗夜深邃', colors: ['#0c0c0c', '#1a1a2e', '#16213e'] },
  { label: '樱花粉白', colors: ['#ffffff', '#fce4ec', '#f8bbd0'] },
]

export function GradientControls({
  config,
  onConfigChange,
}: {
  config: GradientConfig
  onConfigChange: (config: Partial<GradientConfig>) => void
}) {
  return (
    <div className="space-y-1 rounded-xl bg-zinc-100/60 p-4 dark:bg-zinc-800/60">
      <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
        渐变类型
      </label>
      <div className="mb-3 grid grid-cols-4 gap-2">
        {gradientTypeOptions.map((opt) => (
          <SelectableButton
            key={opt.value}
            selected={config.type === opt.value}
            onClick={() => onConfigChange({ type: opt.value })}
            emoji={opt.emoji}
            label={opt.label}
          />
        ))}
      </div>

      {config.type !== 'mesh' && (
        <div className="mb-3">
          <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            渐变方向
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {directionOptions.map((opt) => (
              <button
                key={opt.value}
                className={`rounded-lg border px-2 py-1.5 text-xs transition-all duration-200 ${
                  config.direction === opt.value
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 active:scale-[0.97] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
                type="button"
                onClick={() => onConfigChange({ direction: opt.value })}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
        预设渐变
      </label>
      <div className="mb-3 grid grid-cols-2 gap-2">
        {presetGradients.map((preset, i) => (
          <button
            key={i}
            className={`flex h-8 items-center justify-center rounded-lg border text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] ${
              config.colors[0] === preset.colors[0] && config.colors[1] === preset.colors[1]
                ? 'border-primary ring-1 ring-primary/20'
                : 'border-zinc-200 dark:border-zinc-700'
            }`}
            style={{
              background: config.type === 'radial'
                ? `radial-gradient(circle, ${preset.colors.join(', ')})`
                : config.type === 'conic'
                  ? `conic-gradient(from 0deg, ${preset.colors.join(', ')})`
                  : `linear-gradient(135deg, ${preset.colors.join(', ')})`
            }}
            type="button"
            onClick={() => onConfigChange({ colors: preset.colors })}
          >
            <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] text-white">
              {preset.label}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-3">
        <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          自定义颜色（点击添加）
        </label>
        <div className="flex gap-2">
          {config.colors.map((color, i) => (
            <div key={i} className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700">
              <input
                className="absolute inset-0 size-full cursor-pointer rounded-lg opacity-0"
                type="color"
                value={color}
                onChange={(e) => {
                  const newColors = [...config.colors]
                  newColors[i] = e.target.value
                  onConfigChange({ colors: newColors })
                }}
              />
              <div className="size-6 rounded-md border border-white/50 shadow-sm" style={{ backgroundColor: color }} />
              {config.colors.length > 2 && (
                <button
                  className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-white"
                  type="button"
                  onClick={() => {
                    const newColors = config.colors.filter((_, idx) => idx !== i)
                    onConfigChange({ colors: newColors })
                  }}
                >
                  <span className="text-xs leading-none">×</span>
                </button>
              )}
            </div>
          ))}
          <button
            className="flex size-10 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-zinc-400 transition-colors hover:border-primary hover:text-primary dark:border-zinc-600 dark:hover:border-primary"
            type="button"
            onClick={() => onConfigChange({ colors: [...config.colors, '#ffffff'] })}
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-4">
        <SliderControl
          label="不透明度"
          value={config.opacity}
          min={0.1}
          max={1}
          step={0.05}
          onChange={(v) => onConfigChange({ opacity: v })}
        />
      </div>

      {config.type !== 'mesh' && (
        <div className="mt-4">
          <SliderControl
            label="动画速度"
            value={config.animationSpeed}
            min={0}
            max={20}
            step={1}
            onChange={(v) => onConfigChange({ animationSpeed: v })}
          />
        </div>
      )}

      <div className="mt-4">
        <ToggleSwitch
          label="动画渐变"
          checked={config.animated}
          onChange={() => onConfigChange({ animated: !config.animated })}
          ariaLabel="切换动画渐变"
          size="sm"
        />
      </div>
    </div>
  )
}
