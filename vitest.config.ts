import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use node environment — pure unit tests with no Workers-specific globals.
    // Tests that need Workers globals (crypto, Request, Response, etc.) use
    // globalThis polyfills in test/setup.ts.
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/html.ts', 'src/cfn.ts', 'src/demo.ts'],
    },
  },
});
