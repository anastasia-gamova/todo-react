import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Конфигурация Vite + встроенная конфигурация Vitest (блок test).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: false,
    // Подключаем in-memory localStorage и матчеры до запуска тестов.
    setupFiles: ['./tests/setup.ts'],
  },
})
