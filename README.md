# Rookery website

The public site for [Rookery](https://github.com/Richcb5790/RookeryDesktop), the desktop Git client with
branch lineage and submodule sync. It's a static page served by GitHub Pages at
<https://richcb5790.github.io/RookeryDesktop/>.

The page walks through Rookery's headline features as scroll-driven scenes, set in the app's own
space theme:

- **Visual commit graph**: lanes draw in, merges curve home, and a branch is dragged onto another.
- **Hosting integrations**: GitHub, GitLab, Bitbucket, Azure DevOps, Jira and Trello orbit Rookery and
  light up as each capability scrolls past.
- **Isolate branch**: a lighthouse beam finds `feature/docking`, everything unrelated falls away, then
  the lineage map and timeline appear.
- **Merge editor**: a working miniature of the line-by-line conflict editor. It plays itself once,
  then it's the visitor's to click.
- **Local AI agents**: an agent resolves a merge conflict, explains a commit and writes a commit message.
- A grid of the rest of the toolkit, then **the flight log** (release highlights along a lane, which
  scrolls sideways as the page scrolls down), **private by design**, an **FAQ**, and **downloads**.

Behind all of it: a starfield that streaks when you scroll fast, an aurora whose colour changes
from section to section (`data-sky` on each section), a scroll progress line, and a soft light under
the pointer. All of that stands still for visitors who ask for reduced motion.

## Keeping the page current

The copy describes the app, so it needs a pass when the app gains something worth showing:

- **The flight log** (`#whats-new` in `index.html`) is written by hand: add an `<li class="log-item">`
  at the front for a release worth mentioning. The app's `docs/FEATURE_CATALOG.md` and its release
  commits are the source of truth for what a feature does.
- **Version numbers aren't written down anywhere.** The hero badge, the download cards and the
  "verify your download" terminal take the version from the latest GitHub release when the page loads.
- **macOS** is described as on its way. Once a release carries a `.dmg`, its download card lights up
  on its own, but the wording around it ("Windows and Linux", in the hero, the FAQ, the download
  section, the page's `<head>` and `src/seo.ts`) needs changing by hand.

## Develop

```bash
npm install
```

```bash
npm run dev
```

- `npm test`: unit tests for the download logic (release asset matching, OS detection, caching) and the structured data
- `npm run build`: type-checks, then builds the site into `dist/`
- `npm run preview`: serves the built site

Handy query parameters while developing:

| Parameter | Effect |
|---|---|
| `?motion=reduce` | The calm version: no smooth scrolling, pinning or parallax, every scene in its final state. Visitors who set "reduce motion" in their OS get this automatically. |
| `?release=fixture` | (dev only) Pretends a release exists, using `src/downloads/fixtures/release.json` |
| `?release=none` / `?release=error` | (dev only) The "coming soon" and "couldn't reach GitHub" states |

## Downloads and GitHub Releases

The download buttons read this repository's releases from the GitHub API when the page loads
(`src/config.ts` names the repository). The newest release that isn't a draft or prerelease wins, and
its assets are sorted by operating system:

| OS | Assets used |
|---|---|
| Windows | `.exe` (an installer whose name contains `Setup` comes first), `.msi` |
| macOS | `.dmg`, labeled Apple silicon / Intel / Universal when the names say `arm64` or `universal` |
| Linux | `.AppImage`, `.deb`, `.rpm` |

Anything else, such as `.blockmap` and `latest.yml`, is ignored. Until a release exists, or for an OS a release
has nothing for, the card says **Coming soon** and links to the repository so people can watch it.

To publish a version, create a release on this repository (tag it e.g. `v0.1.0`) and attach what
`npm run build:win`, `build:mac` and `build:linux` write to the app's `release/<version>/` folder. The site
picks it up on the next page load, with no change here. A found release is cached in the visitor's
session for ten minutes, which keeps well under GitHub's limit of 60 anonymous API requests an hour;
"no release yet" is never cached, so a newly published release appears straight away. A newer release
can take up to those ten minutes to replace an older one in a tab that already loaded the page.

## Search engines

- `index.html` carries the title, description, canonical link and the Open Graph and Twitter tags.
  `%SITE_URL%` in it is filled in at build time from `SITE_URL` in `vite.config.ts`, the one place
  the site's address is written. Moving to a custom domain means changing that line.
- The same plugin adds JSON-LD structured data (`src/seo.ts`): the site, the app as a
  `SoftwareApplication`, and an `FAQPage` read from the page's own FAQ, so the two can't drift apart.
- The build writes `sitemap.xml` and `robots.txt`. On a GitHub project page, `robots.txt` isn't at the
  domain's root, so crawlers don't read it; it starts counting on a custom domain.
- `public/social.png` (1200×630) is the card shown when the link is shared.

To get listed sooner, add the site in [Google Search Console](https://search.google.com/search-console)
and [Bing Webmaster Tools](https://www.bing.com/webmasters) and submit `sitemap.xml`. Both verify
ownership with a `<meta>` tag they give you, which goes in the `<head>` of `index.html`.

## Deploy

`.github/workflows/deploy.yml` tests, builds and publishes the site on every push to `main`. One-time
setup: in the repository's **Settings → Pages**, set **Source** to **GitHub Actions**.

The build uses relative paths, so it also works on a custom domain without changes.

## Layout

```
index.html              all of the page's copy (the scenes enhance it; the text reads without JavaScript)
vite.config.ts          the build, and the plugin that fills in the site's address and structured data
src/main.ts             boot: fonts, styles, smooth scroll, starfield, scenes, effects
src/seo.ts              structured data for search engines (pure, unit-tested)
src/scenes/             one module per section (hero, graph, integrations, isolate, merge, agents,
                        features, log, trust, download, footer)
src/lib/                motion settings, smooth scroll, parallax, starfield, page-wide effects,
                        the commit-graph renderer, code highlighting for the demos, icons
src/downloads/          release fetching and OS detection (pure, unit-tested)
src/styles/             tokens.css (the app's Rookery Space palette), effects.css (aurora, progress
                        line, card edges, ticker) and one stylesheet per section
src/assets/brand/       the Professor, the app icon and the spinner, from the app's rookery-space-assets
```

Built with Vite and TypeScript, [GSAP](https://gsap.com) ScrollTrigger for the scenes and
[Lenis](https://lenis.darkroom.engineering) for smooth scrolling. Provider and OS marks come from
[Simple Icons](https://simpleicons.org).
