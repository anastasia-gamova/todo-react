interface TaskFooterProps {
  remaining: number
  hasCompleted: boolean
  onClearCompleted: () => void
}

/** Правильное склонение слова «задача» по числу. */
function pluralTasks(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) {
    return 'задача'
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return 'задачи'
  }
  return 'задач'
}

export default function TaskFooter({
  remaining,
  hasCompleted,
  onClearCompleted,
}: TaskFooterProps) {
  const counterText = `Осталось: ${remaining} ${pluralTasks(remaining)}`

  return (
    <div className="footer">
      <span className="counter" aria-live="polite">
        {counterText}
      </span>

      <button
        className="clear-completed"
        type="button"
        disabled={!hasCompleted}
        onClick={onClearCompleted}
      >
        Удалить выполненные
      </button>
    </div>
  )
}
