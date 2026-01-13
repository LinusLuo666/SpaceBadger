import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'out/', 'dist/', '**/*.d.ts', '**/*.config.*', '**/mockData.ts']
    }
  },
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer/src')
    }
  }
})
