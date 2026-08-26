import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/rls/**/*.test.ts'],
    hookTimeout: 20_000,
    testTimeout: 20_000,
  },
  resolve: {
    alias: { '@': path.resolve(dirname, 'src') },
  },
})
