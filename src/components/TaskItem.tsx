import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { Task } from '../types'

interface TaskItemProps {
  task: Task
  /** Задача уходит из списка — для анимации исчезновения. */
  leaving: boolean
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onEdit: (id: string, title: string) => void
}

export default function TaskItem({
  task,
  leaving,
  onToggle,
  onRemove,
  onEdit,
}: TaskItemProps) {
  // Режим редактирования и черновик текста.
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const editRef = useRef<HTMLInputElement | null>(null)
  // Дублирует `editing` для защиты от повторного сохранения (Enter + blur).
  const editingRef = useRef(false)

  // Войдя в режим редактирования, ставим курсор в поле и выделяем текст.
  useEffect(() => {
    if (editing) {
      const field = editRef.current
      if (field !== null) {
        field.focus()
        field.select()
      }
    }
  }, [editing])

  function startEditing(): void {
    editingRef.current = true
    setDraft(task.title)
    setEditing(true)
  }

  function saveEditing(): void {
    // Защита от повторного вызова (например, blur сразу после Enter).
    if (!editingRef.current) {
      return
    }
    editingRef.current = false
    setEditing(false)
    onEdit(task.id, draft)
  }

  function cancelEditing(): void {
    // Esc — отменяем без сохранения.
    editingRef.current = false
    setEditing(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter') {
      event.preventDefault()
      saveEditing()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      cancelEditing()
    }
  }

  const className = [
    'task-item',
    task.completed ? 'task-item--completed' : '',
    leaving ? 'task-item--leaving' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <li className={className}>
      {!editing ? (
        <>
          {/* Свой круглый чекбокс: настоящий input скрыт, но доступен с клавиатуры. */}
          <span className="checkbox">
            <input
              id={`task-${task.id}`}
              className="checkbox__input"
              type="checkbox"
              checked={task.completed}
              aria-label={`Отметить выполненной: ${task.title}`}
              onChange={() => onToggle(task.id)}
            />
            <span className="checkbox__box" aria-hidden="true">
              <svg className="checkbox__check" viewBox="0 0 24 24">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </span>
          </span>

          <span className="task-item__title" onDoubleClick={startEditing}>
            {task.title}
          </span>

          <button
            className="task-item__button"
            type="button"
            aria-label={`Редактировать задачу: ${task.title}`}
            onClick={startEditing}
          >
            ✎
          </button>
          <button
            className="task-item__button task-item__button--delete"
            type="button"
            aria-label={`Удалить задачу: ${task.title}`}
            onClick={() => onRemove(task.id)}
          >
            ×
          </button>
        </>
      ) : (
        <input
          ref={editRef}
          className="task-item__edit"
          type="text"
          value={draft}
          aria-label={`Редактирование задачи: ${task.title}`}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={saveEditing}
        />
      )}
    </li>
  )
}
