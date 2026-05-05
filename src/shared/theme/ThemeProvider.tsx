import { useLayoutEffect } from 'react'
import type { ReactNode } from 'react'
import { ThemeContext } from './useTheme'
import type { Theme } from './useTheme'

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: Readonly<ThemeProviderProps>) {
  const theme: Theme = 'light'
  const resolvedTheme = 'light'

  useLayoutEffect(() => {
    document.documentElement.classList.remove('dark')
  }, [])

  function setTheme(newTheme: Theme) {
    localStorage.setItem('clinfy-theme', newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
