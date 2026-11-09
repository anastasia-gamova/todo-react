import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_STORAGE_KEY, useTasks } from '../src/hooks/useTasks'
import type { Task } from '../src/types'

// Отдельный ключ для тестов, чтобы не пересекаться с ключом по умолчанию.
const KEY = 'test.tasks'

function readStorage(key: string = KEY): unknown {
  const raw = localStorage.getItem(key)
  return raw === null ? null : JSON.parse(raw)
}

beforeEach(() => {
  localStorage.clear()
})

describe('useTasks — добавление', () => {
  it('добавляет задачу с обрезкой пробелов', () => {
    const { result } = renderHook(() => useTasks(KEY))

    let added = false
    act(() => {
      added = result.current.addTask('  Купить хлеб  ')
    })

    expect(added).toBe(true)
    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0].title).toBe('Купить хлеб')
    expect(result.current.tasks[0].completed).toBe(false)
  })

  it('не добавляет пустую задачу или задачу из пробелов', () => {
    const { result } = renderHook(() => useTasks(KEY))

    act(() => {
      expect(result.current.addTask('')).toBe(false)
      expect(result.current.addTask('   ')).toBe(false)
    })

    expect(result.current.tasks).toHaveLength(0)
  })
})

describe('useTasks — отметка выполнения', () => {
  it('переключает статус задачи', () => {
    const { result } = renderHook(() => useTasks(KEY))
    act(() => {
      result.current.addTask('Задача')
    })
    const id = result.current.tasks[0].id

    act(() => {
      result.current.toggleTask(id)
    })
    expect(result.current.tasks[0].completed).toBe(true)

    act(() => {
      result.current.toggleTask(id)
    })
    expect(result.current.tasks[0].completed).toBe(false)
  })

  it('игнорирует несуществующий id', () => {
    const { result } = renderHook(() => useTasks(KEY))
    act(() => {
      result.current.addTask('Задача')
    })

    act(() => {
      result.current.toggleTask('нет-такого')
    })
    expect(result.current.tasks[0].completed).toBe(false)
  })
})

describe('useTasks — удаление', () => {
  it('удаляет задачу по id', () => {
    const { result } = renderHook(() => useTasks(KEY))
    act(() => {
      result.current.addTask('Первая')
      result.current.addTask('Вторая')
    })
    const id = result.current.tasks[0].id

    act(() => {
      result.current.removeTask(id)
    })
    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0].title).toBe('Вторая')
  })
})

describe('useTasks — редактирование', () => {
  it('сохраняет новый текст с обрезкой пробелов', () => {
    const { result } = renderHook(() => useTasks(KEY))
    act(() => {
      result.current.addTask('Старый текст')
    })
    const id = result.current.tasks[0].id

    let kept = false
    act(() => {
      kept = result.current.editTask(id, '  Новый текст  ')
    })
    expect(kept).toBe(true)
    expect(result.current.tasks[0].title).toBe('Новый текст')
  })

  it('удаляет задачу, если новый текст пустой', () => {
    const { result } = renderHook(() => useTasks(KEY))
    act(() => {
      result.current.addTask('Текст')
    })
    const id = result.current.tasks[0].id

    let kept = true
    act(() => {
      kept = result.current.editTask(id, '   ')
    })
    expect(kept).toBe(false)
    expect(result.current.tasks).toHaveLength(0)
  })
})

describe('useTasks — фильтры и счётчики', () => {
  it('фильтрует активные и выполненные', () => {
    const { result } = renderHook(() => useTasks(KEY))
    act(() => {
      result.current.addTask('A')
      result.current.addTask('B')
      result.current.addTask('C')
    })
    act(() => {
      result.current.toggleTask(result.current.tasks[1].id) // B выполнена
    })

    expect(result.current.filter).toBe('all')
    expect(result.current.filteredTasks).toHaveLength(3)

    act(() => {
      result.current.setFilter('active')
    })
    expect(result.current.filteredTasks.map((t) => t.title)).toEqual(['A', 'C'])

    act(() => {
      result.current.setFilter('completed')
    })
    expect(result.current.filteredTasks.map((t) => t.title)).toEqual(['B'])
  })

  it('считает оставшиеся активные задачи и наличие выполненных', () => {
    const { result } = renderHook(() => useTasks(KEY))
    act(() => {
      result.current.addTask('A')
      result.current.addTask('B')
    })

    expect(result.current.remaining).toBe(2)
    expect(result.current.hasCompleted).toBe(false)

    act(() => {
      result.current.toggleTask(result.current.tasks[0].id)
    })
    expect(result.current.remaining).toBe(1)
    expect(result.current.hasCompleted).toBe(true)
  })

  it('удаляет все выполненные задачи', () => {
    const { result } = renderHook(() => useTasks(KEY))
    act(() => {
      result.current.addTask('A')
      result.current.addTask('B')
      result.current.addTask('C')
    })
    act(() => {
      result.current.toggleTask(result.current.tasks[0].id)
      result.current.toggleTask(result.current.tasks[2].id)
    })

    act(() => {
      result.current.clearCompleted()
    })
    expect(result.current.tasks.map((t) => t.title)).toEqual(['B'])
  })
})

describe('useTasks — сохранение и загрузка', () => {
  it('сохраняет задачи в localStorage при изменениях', () => {
    const { result } = renderHook(() => useTasks(KEY))
    act(() => {
      result.current.addTask('Сохрани меня')
    })

    const saved = readStorage() as Task[]
    expect(Array.isArray(saved)).toBe(true)
    expect(saved).toHaveLength(1)
    expect(saved[0].title).toBe('Сохрани меня')
  })

  it('загружает ранее сохранённые задачи', () => {
    const existing: Task[] = [
      { id: '1', title: 'Была раньше', completed: true, createdAt: 1 },
    ]
    localStorage.setItem(KEY, JSON.stringify(existing))

    const { result } = renderHook(() => useTasks(KEY))
    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0].title).toBe('Была раньше')
    expect(result.current.tasks[0].completed).toBe(true)
  })

  it('использует ключ по умолчанию, если он не задан', () => {
    const { result } = renderHook(() => useTasks())
    act(() => {
      result.current.addTask('Задача')
    })
    expect(localStorage.getItem(DEFAULT_STORAGE_KEY)).not.toBeNull()
  })
})

describe('useTasks — устойчивость к битым данным', () => {
  it('не падает на некорректном JSON', () => {
    localStorage.setItem(KEY, '{не JSON')
    const { result } = renderHook(() => useTasks(KEY))
    expect(result.current.tasks).toEqual([])
  })

  it('игнорирует данные не-массив', () => {
    localStorage.setItem(KEY, JSON.stringify({ foo: 'bar' }))
    const { result } = renderHook(() => useTasks(KEY))
    expect(result.current.tasks).toEqual([])
  })

  it('отбрасывает записи неправильной формы, оставляя корректные', () => {
    const mixed = [
      { id: 'ok', title: 'Правильная', completed: false, createdAt: 1 },
      { id: 'плохая', title: 123, completed: 'нет' },
      null,
      'строка',
    ]
    localStorage.setItem(KEY, JSON.stringify(mixed))

    const { result } = renderHook(() => useTasks(KEY))
    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0].title).toBe('Правильная')
  })
})
