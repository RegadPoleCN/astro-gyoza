import { useAtom } from 'jotai'
import { SliderControl } from './SliderControl'
import { ToggleSwitch } from './ToggleSwitch'
import { SelectableButton } from './SelectableButton'
import {
  clickEffectEnabledAtom,
  clickEffectTypeAtom,
  clickEffectCountAtom,
  clickEffectSizeAtom,
  clickEffectColorAtom,
  clickEffectLifeAtom,
  clickEffectSpreadAtom,
  clickEffectGravityAtom,
  clickEffectFadeOutAtom,
  type ClickEffectType,
} from '@/store/clickEffects'

const typeOptions: { value: ClickEffectType; label: string; emoji: string }[] = [
  { value: 'burst', label: '爆炸', emoji: '💥' },
  { value: 'ripple', label: '波纹', emoji: '🌊' },
  { value: 'sparkle', label: '闪烁', emoji: '✨' },
  { value: 'bubble', label: '气泡', emoji: '🫧' },
  { value: 'confetti', label: '彩带', emoji: '🎊' },
  { value: 'firework', label: '烟花', emoji: '🎆' },
]

export function ClickControls() {
  const [enabled, setEnabled] = useAtom(clickEffectEnabledAtom)
  const [type, setType] = useAtom(clickEffectTypeAtom)
  const [count, setCount] = useAtom(clickEffectCountAtom)
  const [size, setSize] = useAtom(clickEffectSizeAtom)
  const [color, setColor] = useAtom(clickEffectColorAtom)
  const [life, setLife] = useAtom(clickEffectLifeAtom)
  const [spread, setSpread] = useAtom(clickEffectSpreadAtom)
  const [gravity, setGravity] = useAtom(clickEffectGravityAtom)
  const [fadeOut, setFadeOut] = useAtom(clickEffectFadeOutAtom)

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-zinc-100/60 px-4 py-3 dark:bg-zinc-800/60">
        <ToggleSwitch
          label="启用点击效果"
          checked={enabled}
          onChange={() => setEnabled(!enabled)}
          ariaLabel="切换点击效果开关"
        />
      </div>

      {enabled && (
        <>
          <div className="space-y-1 rounded-xl bg-zinc-100/60 p-4 dark:bg-zinc-800/60">
            <SliderControl
              label="粒子数量"
              value={count}
              min={4}
              max={40}
              onChange={setCount}
            />
            <SliderControl
              label="粒子大小"
              value={size}
              min={1}
              max={16}
              onChange={setSize}
              unit="px"
            />
            <SliderControl
              label="存活时间"
              value={life}
              min={0.3}
              max={4}
              step={0.1}
              onChange={setLife}
              unit="s"
            />
            <SliderControl
              label="扩散范围"
              value={spread}
              min={0.3}
              max={3}
              step={0.1}
              onChange={setSpread}
            />
            <SliderControl
              label="重力强度"
              value={gravity}
              min={0}
              max={2}
              step={0.1}
              onChange={setGravity}
            />
            <div className="mt-4">
              <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                自定义颜色（可选，空则自动适配主题）
              </label>
              <input
                className="h-10 w-full cursor-pointer rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
                type="color"
                value={color || '#60a5fa'}
                onChange={(e) => setColor(e.target.value)}
                aria-label="选择点击效果颜色"
              />
            </div>
          </div>

          <div className="rounded-xl bg-zinc-100/60 px-4 py-3 dark:bg-zinc-800/60">
            <ToggleSwitch
              label="淡出效果"
              checked={fadeOut}
              onChange={() => setFadeOut(!fadeOut)}
              ariaLabel="切换淡出效果"
              size="sm"
            />
          </div>

          <div className="rounded-xl bg-zinc-100/60 p-4 dark:bg-zinc-800/60">
            <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              效果类型
            </label>
            <div className="grid grid-cols-3 gap-2">
              {typeOptions.map((opt) => (
                <SelectableButton
                  key={opt.value}
                  selected={type === opt.value}
                  onClick={() => setType(opt.value)}
                  emoji={opt.emoji}
                  label={opt.label}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
