import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {defineConfig} from 'vitest/config'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    // Mirror the `@/*` path alias from tsconfig.json.
    alias: {'@': rootDir},
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['test/setup.ts'],
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'lib/**/*.ts'],
      exclude: [
        // next/font/google only resolves inside the Next.js compiler, so the
        // root layout cannot be imported (let alone rendered) under Vitest.
        'app/layout.tsx',
      ],
      // Enforced on every `pnpm test` run (the test script passes --coverage).
      // Set a few points below the levels achieved by the current suite
      // (98/87/100/100) so they catch regressions without being brittle.
      thresholds: {
        lines: 95,
        statements: 94,
        functions: 95,
        branches: 82,
      },
    },
  },
})
