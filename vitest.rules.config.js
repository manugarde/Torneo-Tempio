import { defineConfig } from 'vitest/config'

// Test che richiedono gli emulatori Firebase: `npm run test:rules`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    fileParallelism: false,
    testTimeout: 20000,
    // Evita due copie di firebase (ESM/CJS): altrimenti "getApp(...).firestore is not a function".
    server: { deps: { inline: ['@firebase/rules-unit-testing'] } },
  },
})
