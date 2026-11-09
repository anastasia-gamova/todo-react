import { useEffect, useRef, useState } from 'react'

/** Один элемент анимированного списка: данные + признак «уходит». */
export interface AnimatedEntry<T> {
  key: string
  item: T
  leaving: boolean
}

/** Учитываем системную настройку «меньше движения». */
function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/**
 * Небольшой хук для анимации списка без сторонних библиотек.
 *
 * React удаляет элементы из DOM сразу, поэтому, чтобы проиграть анимацию
 * исчезновения, мы держим удалённые элементы ещё `duration` мс с флагом
 * `leaving` (по нему CSS проигрывает анимацию ухода), а затем убираем их.
 *
 * Порядок элементов в этом приложении стабильный (добавление — только в конец),
 * поэтому позиции сохраняются корректно.
 */
export function useAnimatedList<T>(
  items: readonly T[],
  getKey: (item: T) => string,
  duration = 260,
): AnimatedEntry<T>[] {
  const [entries, setEntries] = useState<AnimatedEntry<T>[]>(() =>
    items.map((item) => ({ key: getKey(item), item, leaving: false })),
  )
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  useEffect(() => {
    const effectiveDuration = prefersReducedMotion() ? 0 : duration
    const nextItems = new Map<string, T>(
      items.map((item) => [getKey(item), item] as const),
    )

    setEntries((prev) => {
      const result: AnimatedEntry<T>[] = []
      const seen = new Set<string>()

      // Существующие элементы в прежнем порядке: остаются или уходят.
      for (const entry of prev) {
        const current = nextItems.get(entry.key)
        if (current !== undefined) {
          // Элемент на месте — отменяем запланированное удаление, если было.
          const timer = timers.current.get(entry.key)
          if (timer !== undefined) {
            clearTimeout(timer)
            timers.current.delete(entry.key)
          }
          result.push({ key: entry.key, item: current, leaving: false })
          seen.add(entry.key)
        } else if (entry.leaving) {
          // Уже уходит — оставляем на месте до конца анимации.
          result.push(entry)
          seen.add(entry.key)
        } else {
          // Элемент исчез — помечаем «уходящим» и планируем удаление.
          result.push({ ...entry, leaving: true })
          seen.add(entry.key)
          if (!timers.current.has(entry.key)) {
            const key = entry.key
            const timer = setTimeout(() => {
              timers.current.delete(key)
              setEntries((cur) => cur.filter((item) => item.key !== key))
            }, effectiveDuration)
            timers.current.set(key, timer)
          }
        }
      }

      // Новые элементы — в конец, в их порядке.
      for (const item of items) {
        const key = getKey(item)
        if (!seen.has(key)) {
          result.push({ key, item, leaving: false })
          seen.add(key)
        }
      }

      return result
    })
  }, [items, getKey, duration])

  // Чистим все таймеры при размонтировании.
  useEffect(() => {
    const map = timers.current
    return () => {
      map.forEach((timer) => clearTimeout(timer))
      map.clear()
    }
  }, [])

  return entries
}
