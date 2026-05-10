import { useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { customConfigAtom } from '@/store/background'
import { themeAtom } from '@/store/theme'
import { getSystemTheme } from '@/utils/theme'

function resolveTheme(theme: string): 'dark' | 'light' {
  if (theme === 'dark' || theme === 'light') return theme
  return getSystemTheme()
}

export function CustomBackground() {
  const customConfig = useAtomValue(customConfigAtom)
  const theme = useAtomValue(themeAtom)

  const backgroundStyle = useMemo(() => {
    const isDark = resolveTheme(theme) === 'dark'
    if (customConfig.type === 'solid') {
      return { backgroundColor: customConfig.color || (isDark ? '#0f0f23' : '#f5f5f5') }
    }
    if (customConfig.type === 'gradient') {
      const colors = customConfig.colors || ['#667eea', '#764ba2']
      return { background: `linear-gradient(135deg, ${colors.join(', ')})` }
    }
    if (customConfig.type === 'css' && customConfig.css) {
      const cssValue = customConfig.css
      if (cssValue.includes('background:')) {
        const parsed = cssValue.replace('background:', '').trim()
        return { background: parsed }
      }
      return { background: cssValue }
    }
    return { backgroundColor: isDark ? '#0f0f23' : '#f5f5f5' }
  }, [customConfig, theme])

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, ...backgroundStyle }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      aria-hidden="true"
      role="presentation"
    />
  )
}
