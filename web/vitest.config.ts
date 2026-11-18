import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    css: true,
    restoreMocks: true,
    include: ['tests/unit/**/*.test.ts'],
  },
});
