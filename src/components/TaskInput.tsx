import { useState, type FormEvent } from 'react'

interface TaskInputProps {
  /** Добавить задачу с указанным текстом. */
  onAdd: (title: string) => void
}

export default function TaskInput({ onAdd }: TaskInputProps) {
  const [title, setTitle] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    // Пустую задачу не добавляем (проверка и здесь, и в логике useTasks).
    if (title.trim() === '') {
      return
    }
    onAdd(title)
    setTitle('')
  }

  return (
    // form: Enter внутри поля сам отправляет форму, кнопка — тоже.
    <form className="task-input" onSubmit={handleSubmit}>
      <label className="visually-hidden" htmlFor="new-task">
        Новая задача
      </label>
      <input
        id="new-task"
        className="task-input__field"
        type="text"
        placeholder="Что нужно сделать?"
        autoComplete="off"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <button className="task-input__button" type="submit">
        Добавить
      </button>
    </form>
  )
}
