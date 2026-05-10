import { SliderControl } from './SliderControl'
import { ToggleSwitch } from './ToggleSwitch'
import { SelectableButton } from './SelectableButton'
import type { ParticleConfig, ParticleShape } from '@/store/background'

const shapeOptions: { value: ParticleShape; label: string; emoji: string }[] = [
  { value: 'circle', label: '圆形', emoji: '⚪' },
  { value: 'snowflake', label: '雪花', emoji: '❄️' },
  { value: 'heart', label: '心形', emoji: '❤️' },
  { value: 'star', label: '星星', emoji: '⭐' },
  { value: 'bubble', label: '气泡', emoji: '🫧' },
  { value: 'petal', label: '花瓣', emoji: '🌸' },
]

export function ParticleControls({
  config,
  onConfigChange,
}: {
  config: ParticleConfig
  onConfigChange: (key: keyof ParticleConfig, value: number | string | boolean) => void
}) {
  return (
    <div className="space-y-1 rounded-xl bg-zinc-100/60 p-4 dark:bg-zinc-800/60">
      <SliderControl
        label="数量"
        value={config.count}
        min={20}
        max={200}
        onChange={(v) => onConfigChange('count', v)}
      />

      <SliderControl
        label="最小速度"
        value={config.minSpeed}
        min={0.1}
        max={5}
        step={0.1}
        onChange={(v) => onConfigChange('minSpeed', v)}
      />

      <SliderControl
        label="最大速度"
        value={config.maxSpeed}
        min={0.1}
        max={5}
        step={0.1}
        onChange={(v) => onConfigChange('maxSpeed', v)}
      />

      <SliderControl
        label="最小尺寸"
        value={config.minSize}
        min={1}
        max={15}
        onChange={(v) => onConfigChange('minSize', v)}
        unit="px"
      />

      <SliderControl
        label="最大尺寸"
        value={config.maxSize}
        min={1}
        max={15}
        onChange={(v) => onConfigChange('maxSize', v)}
        unit="px"
      />

      <SliderControl
        label="透明度"
        value={config.opacity}
        min={0.1}
        max={1}
        step={0.05}
        onChange={(v) => onConfigChange('opacity', v)}
      />

      <SliderControl
        label="水平漂移幅度"
        value={config.driftAmplitude ?? 0.5}
        min={0.1}
        max={2}
        step={0.1}
        onChange={(v) => onConfigChange('driftAmplitude', v)}
      />

      <SliderControl
        label="旋转速度"
        value={config.rotationSpeed ?? 1}
        min={0.1}
        max={3}
        step={0.1}
        onChange={(v) => onConfigChange('rotationSpeed', v)}
      />

      <div className="mt-4">
        <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          粒子形状
        </label>
        <div className="grid grid-cols-3 gap-2">
          {shapeOptions.map((opt) => (
            <SelectableButton
              key={opt.value}
              selected={(config.shape || 'circle') === opt.value}
              onClick={() => onConfigChange('shape', opt.value)}
              emoji={opt.emoji}
              label={opt.label}
            />
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          自定义颜色（可选）
        </label>
        <input
          className="h-10 w-full cursor-pointer rounded-xl border border-zinc-200 bg-white disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800"
          type="color"
          value={config.color || '#ffffff'}
          onChange={(e) =>
            onConfigChange('color', e.target.value)
          }
          aria-label="选择粒子颜色"
        />
      </div>

      <div className="mt-4">
        <ToggleSwitch
          label="发光效果"
          checked={config.glowEnabled !== false}
          onChange={() => onConfigChange('glowEnabled', config.glowEnabled === false)}
          ariaLabel="切换发光效果"
          size="sm"
        />
      </div>

      <div className="mt-4">
        <ToggleSwitch
          label="运动轨迹"
          checked={config.trailEnabled === true}
          onChange={() => onConfigChange('trailEnabled', config.trailEnabled !== true)}
          ariaLabel="切换运动轨迹"
          size="sm"
        />
      </div>
    </div>
  )
}
