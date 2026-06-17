import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      // TODO(dev-team): raise thresholds as real component/unit tests land.
      // thresholds: { lines: 50, functions: 50, branches: 50, statements: 50 },
    },
  },
})
