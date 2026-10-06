import { defineConfig } from 'vitest/config';

// One test run for every workspace. "development" makes @pattern-lock/shared resolve to its
// TypeScript source, so tests never need a build first.
export default defineConfig({
  resolve: { conditions: ['development'] },
  test: {
    include: ['packages/*/src/**/*.test.ts', 'apps/*/src/**/*.test.{ts,tsx}'],
  },
});
