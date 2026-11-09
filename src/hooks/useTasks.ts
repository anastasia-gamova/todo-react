import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Filter, Task } from '../types'

/** Ключ в localStorage по умолчанию. */
export const DEFAULT_STORAGE_KEY = 'todo-react.tasks'

/** Что возвращает хук наружу — для компонентов. */
export interface UseTasks {
  /** Все задачи (в порядке добавления). */
  tasks: Task[]
  /** Текущий фильтр. */
  filter: Filter
  /** Задачи с учётом текущего фильтра. */
  filteredTasks: Task[]
  /** Сколько задач ещё не выполнено. */
  remaining: number
  /** Есть ли хотя бы одна выполненная задача. */
  hasCompleted: boolean
  /** Добавить задачу. Пустой текст игнорируется. Возвращает true, если добавили. */
  addTask: (title: string) => boolean
  /** Переключить «выполнено / не выполнено». */
  toggleTask: (id: string) => void
  /** Удалить задачу. */
  removeTask: (id: string) => void
  /** Сохранить новый текст задачи. Пустой текст удаляет задачу. Возвращает true, если задача осталась. */
  editTask: (id: string, title: string) => boolean
  /** Установить фильтр. */
  setFilter: (value: Filter) => void
  /** Удалить все выполненные задачи. */
  clearCompleted: () => void
}

/** Генерация идентификатора с запасным вариантом, если crypto.randomUUID недоступен. */
function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** Проверка, что произвольное значение похоже на корректную задачу. */
function isValidTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.completed === 'boolean' &&
    typeof candidate.createdAt === 'number'
  )
}

/**
 * Безопасная загрузка задач из localStorage.
 * При любой ошибке (нет данных, битый JSON, не тот формат) возвращает пустой список,
 * чтобы приложение не падало.
 */
function loadTasks(storageKey: string): Task[] {
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw === null) {
      return []
    }
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }
    // Оставляем только валидные записи и нормализуем текст.
    return parsed.filter(isValidTask).map((task) => ({
      id: task.id,
      title: task.title.trim(),
      completed: task.completed,
      createdAt: task.createdAt,
    }))
  } catch {
    // Любая ошибка разбора — начинаем с пустого списка.
    return []
  }
}

/** Безопасное сохранение задач в localStorage (ошибки записи игнорируем). */
function saveTasks(storageKey: string, tasks: Task[]): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(tasks))
  } catch {
    // Например, приватный режим или переполнение — молча пропускаем.
  }
}

/**
 * Вся логика работы со списком задач.
 * Не зависит от компонентов, поэтому её удобно тестировать отдельно.
 */
export function useTasks(storageKey: string = DEFAULT_STORAGE_KEY): UseTasks {
  // Начальное состояние читаем из localStorage один раз (ленивая инициализация).
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks(storageKey))
  const [filter, setFilterState] = useState<Filter>('all')

  // Любое изменение списка сразу сохраняем в localStorage.
  useEffect(() => {
    saveTasks(storageKey, tasks)
  }, [storageKey, tasks])

  // Производные значения пересчитываются только при изменении зависимостей.
  const filteredTasks = useMemo<Task[]>(() => {
    switch (filter) {
      case 'active':
        return tasks.filter((task) => !task.completed)
      case 'completed':
        return tasks.filter((task) => task.completed)
      default:
        return tasks
    }
  }, [tasks, filter])

  const remaining = useMemo<number>(
    () => tasks.filter((task) => !task.completed).length,
    [tasks],
  )

  const hasCompleted = useMemo<boolean>(
    () => tasks.some((task) => task.completed),
    [tasks],
  )

  const addTask = useCallback((title: string): boolean => {
    const trimmed = title.trim()
    if (trimmed === '') {
      return false
    }
    setTasks((prev) => [
      ...prev,
      {
        id: createId(),
        title: trimmed,
        completed: false,
        createdAt: Date.now(),
      },
    ])
    return true
  }, [])

  const toggleTask = useCallback((id: string): void => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    )
  }, [])

  const removeTask = useCallback((id: string): void => {
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }, [])

  const editTask = useCallback((id: string, title: string): boolean => {
    const trimmed = title.trim()
    // Пустой текст после редактирования — считаем, что задачу удалили.
    if (trimmed === '') {
      setTasks((prev) => prev.filter((task) => task.id !== id))
      return false
    }
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, title: trimmed } : task)),
    )
    return true
  }, [])

  const setFilter = useCallback((value: Filter): void => {
    setFilterState(value)
  }, [])

  const clearCompleted = useCallback((): void => {
    setTasks((prev) => prev.filter((task) => !task.completed))
  }, [])

  return {
    tasks,
    filter,
    filteredTasks,
    remaining,
    hasCompleted,
    addTask,
    toggleTask,
    removeTask,
    editTask,
    setFilter,
    clearCompleted,
  }
}
