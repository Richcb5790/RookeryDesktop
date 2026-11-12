import { describe, expect, it } from 'vitest'
import page from '../index.html?raw'
import { faqFromHtml, plainText, structuredData } from '../src/seo'

describe('plainText', () => {
  it('drops tags, decodes entities and collapses whitespace', () => {
    expect(plainText('  Git 2.40 on your <code>PATH</code>,\n   Preferences &rarr; Updates &amp; more ')).toBe(
      'Git 2.40 on your PATH, Preferences → Updates & more'
    )
  })
})

describe('faqFromHtml', () => {
  it('reads each question and its answer', () => {
    const html = `
      <details class="faq-item" data-reveal open>
        <summary><h3>What is it?</h3><i data-icon="chevron"></i></summary>
        <div class="faq-a"><p>A <b>Git</b> client.</p></div>
      </details>
      <details class="faq-item">
        <summary><h3>Is it free?</h3></summary>
        <div class="faq-a"><p>Yes.</p></div>
      </details>`
    expect(faqFromHtml(html)).toEqual([
      { question: 'What is it?', answer: 'A Git client.' },
      { question: 'Is it free?', answer: 'Yes.' }
    ])
  })

  it('finds the FAQ on the real page', () => {
    const faq = faqFromHtml(page)
    expect(faq.length).toBeGreaterThanOrEqual(6)
    for (const f of faq) {
      expect(f.question).toMatch(/\?$/)
      expect(f.answer.length).toBeGreaterThan(40)
      expect(f.answer).not.toMatch(/[<>]/)
    }
  })
})

describe('structuredData', () => {
  const url = 'https://example.test/rookery/'

  it('describes the site and the app, with absolute URLs', () => {
    const graph = structuredData(url, [])['@graph'] as Record<string, unknown>[]
    expect(graph.map((n) => n['@type'])).toEqual(['WebSite', 'SoftwareApplication'])
    expect(graph[1].image).toBe(`${url}social.png`)
    expect(graph[1].operatingSystem).not.toMatch(/mac/i)
  })

  it('adds the FAQ when there is one', () => {
    const graph = structuredData(url, [{ question: 'Q?', answer: 'A.' }])['@graph'] as Record<string, unknown>[]
    expect(graph[2]).toMatchObject({
      '@type': 'FAQPage',
      mainEntity: [{ '@type': 'Question', name: 'Q?', acceptedAnswer: { '@type': 'Answer', text: 'A.' } }]
    })
  })
})
