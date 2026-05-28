import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    fileParallelism: false,
    include: ['**/*.{test,spec}.js'],
    setupFiles: ['./tests/setup.js'],
    env: {
      NODE_ENV: 'test'
    }
  },
});
