import { useState, useEffect, useLayoutEffect } from 'react'
import type { ReactNode } from 'react'
import { ThemeContext } from './useTheme'
import type { Theme } from './useTheme'

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem('clinfy-theme') as Theme) ?? 'system'
  )

  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  const resolvedTheme: 'light' | 'dark' =
    theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : theme

  useLayoutEffect(() => {
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [resolvedTheme])

  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    function handleChange(event: MediaQueryListEvent) {
      setSystemPrefersDark(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  function setTheme(newTheme: Theme) {
    setThemeState(newTheme)
    localStorage.setItem('clinfy-theme', newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
