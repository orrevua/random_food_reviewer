import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import pt from './locales/pt'
import en from './locales/en'

export type Locale = 'pt' | 'en'
export type TranslationKey = keyof typeof pt

type Dict = { [K in keyof typeof pt]: string }
const DICTS: Record<Locale, Dict> = { pt, en }
const STORAGE_KEY = 'foodreviewer.lang'

function detectInitialLocale(): Locale {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'pt' || stored === 'en') return stored
    if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('pt')) {
      return 'pt'
    }
  }
  return 'en'
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const v = vars[key]
    return v == null ? '' : String(v)
  })
}

type Ctx = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}

const LocaleContext = createContext<Ctx | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => detectInitialLocale())

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale
    }
  }, [locale])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try {
      window.localStorage.setItem(STORAGE_KEY, l)
    } catch {
      // ignore storage failures (private mode, etc.)
    }
  }, [])

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) =>
      interpolate(DICTS[locale][key], vars),
    [locale],
  )

  const value = useMemo<Ctx>(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useTranslation(): Ctx {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useTranslation must be used within LocaleProvider')
  return ctx
}
