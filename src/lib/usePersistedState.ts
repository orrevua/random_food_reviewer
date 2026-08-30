import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * useState whose value is mirrored to localStorage so it survives component
 * unmounts (page navigation) and full context teardown (PWA eviction / reload).
 *
 * Pass `key = null` to opt out of persistence and behave like plain useState.
 * Call the returned `clear()` after a successful submit to drop the draft.
 */
export function usePersistedState<T>(key: string | null, initial: T) {
  const initialRef = useRef(initial)

  const [value, setValue] = useState<T>(() => {
    if (key == null) return initialRef.current
    try {
      const raw = window.localStorage.getItem(key)
      if (raw != null) return JSON.parse(raw) as T
    } catch {
      // ignore corrupt/unavailable storage
    }
    return initialRef.current
  })

  useEffect(() => {
    if (key == null) return
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // ignore quota / private-mode failures
    }
  }, [key, value])

  const clear = useCallback(() => {
    if (key != null) {
      try {
        window.localStorage.removeItem(key)
      } catch {
        // ignore
      }
    }
    setValue(initialRef.current)
  }, [key])

  return [value, setValue, clear] as const
}
