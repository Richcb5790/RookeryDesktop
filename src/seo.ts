// Structured data for search engines, built at build time by the plugin in vite.config.ts. Pure
// functions with no DOM, so they run in Node and are unit-tested.

export interface Faq {
  question: string
  answer: string
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", rarr: '→', nbsp: ' ', '#39': "'" }

/** Markup to plain text: tags dropped, the entities the page uses decoded, whitespace collapsed. */
export function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&(#?\w+);/g, (m, name: string) => ENTITIES[name] ?? m)
    .replace(/\s+/g, ' ')
    .trim()
}

/** Reads the questions and answers out of the page's `<details class="faq-item">` blocks. */
export function faqFromHtml(html: string): Faq[] {
  const out: Faq[] = []
  const item = /<details class="faq-item"[^>]*>\s*<summary>\s*<h3>([\s\S]*?)<\/h3>[\s\S]*?<\/summary>\s*<div class="faq-a">([\s\S]*?)<\/div>\s*<\/details>/g
  for (const m of html.matchAll(item)) out.push({ question: plainText(m[1]), answer: plainText(m[2]) })
  return out
}

const DESCRIPTION =
  'Rookery is a desktop Git client (Git GUI) for Windows and Linux with a visual commit graph, branch lineage, submodule sync, hosting integrations and support for your own local AI coding agent.'

/** A schema.org graph: the site, the application, and the FAQ shown on the page. */
export function structuredData(siteUrl: string, faq: Faq[]): Record<string, unknown> {
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}#website`,
      url: siteUrl,
      name: 'Rookery',
      description: DESCRIPTION,
      inLanguage: 'en'
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${siteUrl}#app`,
      name: 'Rookery',
      alternateName: ['Rookery Desktop', 'Rookery Git client'],
      description: DESCRIPTION,
      url: siteUrl,
      image: `${siteUrl}social.png`,
      applicationCategory: 'DeveloperApplication',
      applicationSubCategory: 'Git client',
      operatingSystem: 'Windows 10, Windows 11, Linux',
      softwareRequirements: 'Git 2.40 or newer',
      downloadUrl: 'https://github.com/Richcb5790/RookeryDesktop/releases/latest',
      releaseNotes: 'https://github.com/Richcb5790/RookeryDesktop/releases',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: [
        'Visual commit graph with drag-and-drop merge, rebase and pull requests',
        'Branch lineage: isolate a branch to see where it came from and where it merged',
        'Submodule sync across create, checkout, merge, push, pull, rename, delete and rebase',
        'Line-by-line merge conflict editor',
        'GitHub, GitLab, Bitbucket and Azure DevOps pull requests; Jira and Trello issues',
        'Conflict resolution, commit explanations and commit messages from a local AI agent',
        'Interactive rebase, worktrees, Git LFS, Git Flow, image diffs, blame and a built-in terminal',
        'Signed installers and signed in-app updates'
      ]
    }
  ]
  if (faq.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${siteUrl}#faq`,
      mainEntity: faq.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer }
      }))
    })
  }
  return { '@context': 'https://schema.org', '@graph': graph }
}
