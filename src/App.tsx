import { useTasks } from './hooks/useTasks'
import { useTheme } from './hooks/useTheme'
import TaskInput from './components/TaskInput'
import TaskFilters from './components/TaskFilters'
import TaskList from './components/TaskList'
import TaskFooter from './components/TaskFooter'
import ThemeToggle from './components/ThemeToggle'

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme()

  const {
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
  } = useTasks()

  // Совсем нет задач.
  const isEmpty = tasks.length === 0
  // Задачи есть, но под текущий фильтр ничего не попало.
  const nothingInFilter = !isEmpty && filteredTasks.length === 0

  function emptyFilterMessage(): string {
    if (filter === 'active') {
      return 'Нет активных задач — всё сделано 🎉'
    }
    if (filter === 'completed') {
      return 'Пока нет выполненных задач'
    }
    return 'Нет задач'
  }

  return (
    <div className="app">
      <main className="card">
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
        <h1 className="card__title">Список задач</h1>

        <TaskInput onAdd={addTask} />

        {isEmpty ? (
          <section className="empty">
            <div className="empty__emoji" aria-hidden="true">
              📝
            </div>
            <p>Пока нет задач. Добавьте первую!</p>
          </section>
        ) : (
          <>
            {/* Фильтры — сверху. */}
            <TaskFilters value={filter} onChange={setFilter} />

            {nothingInFilter ? (
              <p className="empty empty--small">{emptyFilterMessage()}</p>
            ) : (
              // key={filter} — список перемонтируется при смене фильтра,
              // поэтому заново проигрывается анимация появления задач.
              <TaskList
                key={filter}
                tasks={filteredTasks}
                onToggle={toggleTask}
                onRemove={removeTask}
                onEdit={editTask}
              />
            )}

            {/* Футер под списком: счётчик слева, кнопка справа. */}
            <TaskFooter
              remaining={remaining}
              hasCompleted={hasCompleted}
              onClearCompleted={clearCompleted}
            />
          </>
        )}
      </main>
    </div>
  )
}
