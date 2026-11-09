import type { Filter } from '../types'

interface TaskFiltersProps {
  value: Filter
  onChange: (value: Filter) => void
}

const filters: ReadonlyArray<{ value: Filter; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'completed', label: 'Выполненные' },
]

export default function TaskFilters({ value, onChange }: TaskFiltersProps) {
  return (
    <div className="filters-bar">
      <div className="filters" role="group" aria-label="Фильтр задач">
        {filters.map((item) => (
          <button
            key={item.value}
            className="filters__button"
            type="button"
            aria-pressed={value === item.value}
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
