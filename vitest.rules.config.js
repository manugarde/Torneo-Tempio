import { defineConfig } from 'vitest/config'

// Test che richiedono gli emulatori Firebase: `npm run test:rules`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    fileParallelism: false,
    testTimeout: 20000,
  },
})
