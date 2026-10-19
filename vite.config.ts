import { defineConfig } from 'vitest/config'

// Relative asset paths, so the build works at richcb5790.github.io/RookeryDesktop/ and on a custom domain.
export default defineConfig({
  base: './',
  build: {
    target: 'es2022'
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node'
  }
})
