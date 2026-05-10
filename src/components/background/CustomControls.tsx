import { SelectableButton } from './SelectableButton'
import type { CustomConfig, CustomType } from '@/store/background'

const customTypeOptions: { value: CustomType; label: string; emoji: string }[] = [
  { value: 'solid', label: '纯色', emoji: '🎨' },
  { value: 'gradient', label: '自定义渐变', emoji: '🌈' },
  { value: 'css', label: '自定义 CSS', emoji: '📝' },
]

export function CustomControls({
  config,
  onConfigChange,
}: {
  config: CustomConfig
  onConfigChange: (config: Partial<CustomConfig>) => void
}) {
  return (
    <div className="space-y-1 rounded-xl bg-zinc-100/60 p-4 dark:bg-zinc-800/60">
      <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
        自定义类型
      </label>
      <div className="mb-3 grid grid-cols-3 gap-2">
        {customTypeOptions.map((opt) => (
          <SelectableButton
            key={opt.value}
            selected={config.type === opt.value}
            onClick={() => onConfigChange({ type: opt.value })}
            emoji={opt.emoji}
            label={opt.label}
          />
        ))}
      </div>

      {config.type === 'solid' && (
        <div className="mt-3">
          <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            背景颜色
          </label>
          <div className="flex gap-2">
            <input
              className="h-10 w-full cursor-pointer rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
              type="color"
              value={config.color || '#1a1a2e'}
              onChange={(e) => onConfigChange({ color: e.target.value })}
              aria-label="选择背景颜色"
            />
          </div>
          <div className="mt-2 flex gap-2">
            {['#1a1a2e', '#0f0f23', '#2d1b69', '#1e3a5f', '#0a192f', '#f5f5f5'].map((c) => (
              <button
                key={c}
                className={`h-6 w-6 flex-shrink-0 rounded-md border transition-transform hover:scale-110 ${
                  config.color === c ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-zinc-800' : 'border-zinc-300 dark:border-zinc-600'
                }`}
                style={{ backgroundColor: c }}
                type="button"
                onClick={() => onConfigChange({ color: c })}
              />
            ))}
          </div>
        </div>
      )}

      {config.type === 'css' && (
        <div className="mt-3">
          <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            自定义 CSS
          </label>
          <textarea
            className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-xs font-mono text-zinc-700 placeholder-zinc-400 focus:border-primary focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:placeholder-zinc-500 dark:focus:border-primary"
            rows={5}
            placeholder="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"
            value={config.css || ''}
            onChange={(e) => onConfigChange({ css: e.target.value })}
          />
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            💡 输入完整的 CSS background 属性值
          </p>
        </div>
      )}

      {config.type === 'gradient' && (
        <div className="mt-3">
          <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            渐变颜色
          </label>
          <div className="flex gap-2">
            {(config.colors || ['#667eea', '#764ba2']).map((color: string, i: number) => (
              <input
                key={i}
                className="h-10 flex-1 cursor-pointer rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
                type="color"
                value={color}
                onChange={(e) => {
                  const colors = [...(config.colors || ['#667eea', '#764ba2'])]
                  colors[i] = e.target.value
                  onConfigChange({ colors })
                }}
              />
            ))}
          </div>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            线性渐变: linear-gradient(135deg, color1, color2)
          </p>
        </div>
      )}
    </div>
  )
}
