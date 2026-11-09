import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../src/App'

beforeEach(() => {
  localStorage.clear()
})

/** Добавляет задачу через поле ввода и кнопку «Добавить». */
async function addTask(
  user: ReturnType<typeof userEvent.setup>,
  title: string,
): Promise<void> {
  await user.type(screen.getByLabelText('Новая задача'), title)
  await user.click(screen.getByRole('button', { name: 'Добавить' }))
}

describe('App — интерфейс', () => {
  it('показывает пустое состояние, когда задач нет', () => {
    render(<App />)
    expect(
      screen.getByText('Пока нет задач. Добавьте первую!'),
    ).toBeInTheDocument()
  })

  it('добавляет задачу по кнопке «Добавить»', async () => {
    const user = userEvent.setup()
    render(<App />)

    await addTask(user, 'Купить молоко')

    expect(screen.getByText('Купить молоко')).toBeInTheDocument()
    expect(screen.getByText('Осталось: 1 задача')).toBeInTheDocument()
  })

  it('добавляет задачу по нажатию Enter', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Новая задача'), 'Погулять{Enter}')

    expect(screen.getByText('Погулять')).toBeInTheDocument()
  })

  it('не добавляет задачу из одних пробелов', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Новая задача'), '   {Enter}')

    expect(
      screen.getByText('Пока нет задач. Добавьте первую!'),
    ).toBeInTheDocument()
  })

  it('отмечает задачу выполненной по клику на чекбокс', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'Задача')

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()

    await user.click(checkbox)

    expect(checkbox).toBeChecked()
    expect(screen.getByText('Осталось: 0 задач')).toBeInTheDocument()
  })

  it('удаляет задачу по кнопке удаления', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'Удали меня')

    await user.click(
      screen.getByRole('button', { name: 'Удалить задачу: Удали меня' }),
    )

    await waitFor(() => {
      expect(screen.queryByText('Удали меня')).not.toBeInTheDocument()
    })
    expect(
      screen.getByText('Пока нет задач. Добавьте первую!'),
    ).toBeInTheDocument()
  })

  it('фильтрует задачи кнопками «Активные» и «Выполненные»', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'Активная')
    await addTask(user, 'Выполненная')

    // Отмечаем вторую задачу выполненной.
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[1])

    await user.click(screen.getByRole('button', { name: 'Выполненные' }))
    expect(screen.getByText('Выполненная')).toBeInTheDocument()
    expect(screen.queryByText('Активная')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Активные' }))
    expect(screen.getByText('Активная')).toBeInTheDocument()
    expect(screen.queryByText('Выполненная')).not.toBeInTheDocument()
  })

  it('удаляет выполненные по кнопке «Удалить выполненные»', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'Остаётся')
    await addTask(user, 'Уходит')

    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[1])

    await user.click(
      screen.getByRole('button', { name: 'Удалить выполненные' }),
    )

    await waitFor(() => {
      expect(screen.queryByText('Уходит')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Остаётся')).toBeInTheDocument()
  })

  it('редактирует задачу по кнопке-карандашу и сохраняет по Enter', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'Старое название')

    await user.click(
      screen.getByRole('button', {
        name: 'Редактировать задачу: Старое название',
      }),
    )

    const field = screen.getByLabelText('Редактирование задачи: Старое название')
    await user.clear(field)
    await user.type(field, 'Новое название{Enter}')

    expect(screen.getByText('Новое название')).toBeInTheDocument()
    expect(screen.queryByText('Старое название')).not.toBeInTheDocument()
  })
})
