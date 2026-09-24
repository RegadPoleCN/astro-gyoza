import { themeAtom } from '@/store/theme'
import { useAtom } from 'jotai'

export function HeaderThemeToggle() {
  const [theme, setTheme] = useAtom(themeAtom)

  const toggleTheme = () => {
    // 浅色 -> 深色 -> 系统 -> 浅色 循环切换
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const currentIcon = () => {
    if (theme === 'light') return 'icon-sun'
    if (theme === 'dark') return 'icon-moon'
    return 'icon-computer'
  }

  const tooltipLabel = () => {
    if (theme === 'light') return '当前亮色模式（点击切换为暗色）'
    if (theme === 'dark') return '当前暗色模式（点击切换为跟随系统）'
    return '当前跟随系统（点击切换为亮色）'
  }

  return (
    <button
      className="size-9 rounded-full shadow-lg shadow-zinc-800/5 border border-primary bg-white/50 dark:bg-zinc-800/50 backdrop-blur flex items-center justify-center text-primary hover:text-accent transition-colors"
      type="button"
      aria-label="Toggle theme"
      title={tooltipLabel()}
      onClick={toggleTheme}
    >
      <i className={`iconfont ${currentIcon()} text-base`}></i>
    </button>
  )
}
