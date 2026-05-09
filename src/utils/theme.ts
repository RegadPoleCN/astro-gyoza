const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined'

export function changePageTheme(theme: string) {
  if (!isBrowser) return
  document.documentElement.setAttribute('data-theme', theme)
}

export function getSystemTheme() {
  if (!isBrowser) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const themeKey = 'gyoza-theme'

export function getLocalTheme(): string {
  if (!isBrowser) return 'system'
  const local = localStorage.getItem(themeKey)
  if (local === 'dark' || local === 'light') {
    return local
  } else {
    setLocalTheme('system')
    return 'system'
  }
}

export function setLocalTheme(theme: string) {
  if (!isBrowser) return
  localStorage.setItem(themeKey, theme)
}
