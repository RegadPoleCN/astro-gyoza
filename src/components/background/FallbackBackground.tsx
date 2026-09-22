import { useAtomValue } from 'jotai'
import { themeAtom } from '@/store/theme'
import { getSystemTheme } from '@/utils/theme'

function resolveTheme(theme: string): 'dark' | 'light' {
  if (theme === 'dark' || theme === 'light') return theme
  return getSystemTheme()
}

export function FallbackBackground() {
  const theme = useAtomValue(themeAtom)
  const isDark = resolveTheme(theme) === 'dark'
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 0,
        backgroundColor: 'transparent',
        backgroundImage: isDark
          ? [
              'radial-gradient(ellipse at 20% 50%, rgba(var(--color-accent), 0.08) 0%, transparent 50%)',
              'radial-gradient(ellipse at 80% 20%, rgba(var(--color-accent), 0.05) 0%, transparent 50%)',
            ].join(', ')
          : [
              'radial-gradient(ellipse at 20% 50%, rgba(var(--color-accent), 0.05) 0%, transparent 50%)',
              'radial-gradient(ellipse at 80% 20%, rgba(var(--color-accent), 0.03) 0%, transparent 50%)',
            ].join(', '),
      }}
      aria-hidden="true"
      role="presentation"
    />
  )
}
