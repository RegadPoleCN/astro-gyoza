export function ToggleSwitch({
  label,
  checked,
  onChange,
  ariaLabel,
  size = 'md',
}: {
  label: string
  checked: boolean
  onChange: () => void
  ariaLabel: string
  size?: 'sm' | 'md'
}) {
  const sizes = {
    md: {
      button: 'w-11 h-6',
      dot: 'size-[18px]',
      checked: 'translate-x-[22px]',
      unchecked: 'translate-x-0',
    },
    sm: {
      button: 'w-9 h-5',
      dot: 'size-[14px]',
      checked: 'translate-x-[18px]',
      unchecked: 'translate-x-0',
    },
  }

  const s = sizes[size]

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      <button
        className={`relative shrink-0 ${s.button} rounded-full transition-colors duration-200 ${
          checked ? 'bg-accent' : 'bg-zinc-300 dark:bg-zinc-600'
        }`}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        onClick={onChange}
      >
        <span
          className={`absolute left-0.5 top-0.5 ${s.dot} rounded-full bg-white dark:bg-zinc-100 transition-transform duration-200 shadow-sm ${
            checked ? s.checked : s.unchecked
          }`}
        />
      </button>
    </div>
  )
}
