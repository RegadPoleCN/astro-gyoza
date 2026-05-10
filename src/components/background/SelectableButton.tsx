interface SelectableButtonProps {
  selected: boolean
  onClick: () => void
  emoji: string
  label: string
  ariaLabel?: string
}

export function SelectableButton({
  selected,
  onClick,
  emoji,
  label,
  ariaLabel,
}: SelectableButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel || label}
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 rounded-xl border px-2 py-2 text-xs transition-all duration-200 ${
        selected
          ? 'border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20'
          : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600'
      }`}
    >
      <span className="text-base">{emoji}</span>
      <span>{label}</span>
    </button>
  )
}
