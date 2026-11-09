// Одна задача в списке.
export interface Task {
  /** Уникальный идентификатор. */
  id: string
  /** Текст задачи (всегда непустой, уже обрезанный от пробелов). */
  title: string
  /** Выполнена ли задача. */
  completed: boolean
  /** Время создания (мс), используется для стабильного порядка. */
  createdAt: number
}

// Текущий фильтр отображения списка.
export type Filter = 'all' | 'active' | 'completed'
