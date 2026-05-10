interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
  disabled?: boolean
}

export function SliderControl({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  disabled,
}: SliderProps) {
  const progress = ((value - min) / (max - min)) * 100
  return (
    <div className="mb-4 group">
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {label}
        </label>
        <span className="min-w-[2.5rem] rounded bg-zinc-100 px-1.5 py-0.5 text-center text-xs font-mono text-primary dark:bg-zinc-700">
          {value}
          {unit}
        </span>
      </div>
      <div className="relative h-6 flex items-center">
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className="h-full rounded-full bg-primary/30 transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
        <input
          className="slider-input relative w-full cursor-pointer appearance-none bg-transparent accent-primary disabled:opacity-50"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={`调整${label}`}
        />
      </div>
    </div>
  )
}
