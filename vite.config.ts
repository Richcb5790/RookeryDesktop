import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import { faqFromHtml, structuredData } from './src/seo.ts'

// Where the site is served. Canonical and social tags, the structured data and the sitemap all use
// it, so moving to a custom domain means changing this one line.
const SITE_URL = 'https://richcb5790.github.io/RookeryDesktop/'

/**
 * Search engine plumbing, kept out of the page's markup:
 * - fills `%SITE_URL%` in index.html (canonical, Open Graph and Twitter tags need absolute URLs);
 * - adds JSON-LD describing the app, the site and the FAQ, with the FAQ read from the page itself so
 *   the two can't drift apart;
 * - writes sitemap.xml and robots.txt next to the built page.
 */
function seo(): Plugin {
  return {
    name: 'rookery-seo',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const data = structuredData(SITE_URL, faqFromHtml(html))
        return {
          html: html.replaceAll('%SITE_URL%', SITE_URL),
          tags: [
            {
              tag: 'script',
              attrs: { type: 'application/ld+json' },
              // "<" can't appear raw inside a script element without risking an early close.
              children: JSON.stringify(data).replace(/</g, '\\u003c'),
              injectTo: 'head'
            }
          ]
        }
      }
    },
    generateBundle() {
      const today = new Date().toISOString().slice(0, 10)
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${SITE_URL}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n`
      })
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`
      })
    }
  }
}

// Relative asset paths, so the build works at richcb5790.github.io/RookeryDesktop/ and on a custom domain.
export default defineConfig({
  base: './',
  plugins: [seo()],
  build: {
    target: 'es2022'
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node'
  }
})
