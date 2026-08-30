import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'light' | 'dark' | 'feast'
export const THEME_ORDER: Theme[] = ['light', 'dark', 'feast']
const STORAGE_KEY = 'foodreviewer.theme'

type Ctx = {
  theme: Theme
  toggle: () => void
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<Ctx | null>(null)

function detectInitial(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'feast') return stored
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function apply(theme: Theme) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  // 'feast' is a light-based palette, so keep native form controls light.
  root.style.colorScheme = theme === 'dark' ? 'dark' : 'light'
}

if (typeof document !== 'undefined') {
  apply(detectInitial())
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => detectInitial())

  useEffect(() => {
    apply(theme)
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  const setTheme = useCallback((t: Theme) => setThemeState(t), [])
  const toggle = useCallback(
    () => setThemeState((t) => THEME_ORDER[(THEME_ORDER.indexOf(t) + 1) % THEME_ORDER.length]),
    [],
  )

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>{children}</ThemeContext.Provider>
  )
}

export function useTheme(): Ctx {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
