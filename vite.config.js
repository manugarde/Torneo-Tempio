import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/Torneo-Tempio/',
  plugins: [svelte()],
  build: { sourcemap: true },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
