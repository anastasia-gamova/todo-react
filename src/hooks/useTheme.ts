import { useCallback, useEffect, useRef, useState } from 'react'

export type Theme = 'light' | 'dark'

/** Ключ в localStorage для сохранённой темы. */
export const THEME_STORAGE_KEY = 'todo-react.theme'

export interface UseTheme {
  /** Текущая тема. */
  theme: Theme
  /** Переключить светлую/тёмную тему и запомнить выбор. */
  toggle: () => void
}

/** Безопасно читаем сохранённую тему (или null, если её нет/ошибка). */
function readStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    // Нет доступа к localStorage — считаем, что выбор не сохранён.
    return null
  }
}

/** Системная тема по настройке ОС. */
function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/** Применяем тему к документу — CSS читает её через [data-theme]. */
function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
}

/**
 * Управление темой:
 * — старт по сохранённому выбору, иначе по системной настройке;
 * — пока пользователь не выбрал вручную, следуем за системной темой.
 */
export function useTheme(): UseTheme {
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme() ?? systemTheme())
  // Запомнил ли пользователь выбор явно (ref — чтобы не вызывать перерисовку).
  const explicitRef = useRef<boolean>(readStoredTheme() !== null)

  // Применяем тему к документу при каждом изменении.
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Следим за системной темой, пока выбор не сделан вручную.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (event: MediaQueryListEvent): void => {
      if (!explicitRef.current) {
        setTheme(event.matches ? 'dark' : 'light')
      }
    }
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [])

  const toggle = useCallback((): void => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      explicitRef.current = true
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next)
      } catch {
        // Сохранение необязательно — тема всё равно применится.
      }
      return next
    })
  }, [])

  return { theme, toggle }
}
