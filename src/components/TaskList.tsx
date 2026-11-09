import { useCallback } from 'react'
import type { Task } from '../types'
import { useAnimatedList } from '../hooks/useAnimatedList'
import TaskItem from './TaskItem'

interface TaskListProps {
  tasks: Task[]
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onEdit: (id: string, title: string) => void
}

export default function TaskList({
  tasks,
  onToggle,
  onRemove,
  onEdit,
}: TaskListProps) {
  // Стабильная функция ключа — чтобы хук анимации не перезапускался зря.
  const getKey = useCallback((task: Task) => task.id, [])
  const entries = useAnimatedList(tasks, getKey)

  return (
    <ul className="task-list">
      {entries.map((entry) => (
        <TaskItem
          key={entry.key}
          task={entry.item}
          leaving={entry.leaving}
          onToggle={onToggle}
          onRemove={onRemove}
          onEdit={onEdit}
        />
      ))}
    </ul>
  )
}
