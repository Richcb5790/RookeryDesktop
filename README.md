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
- **Local AI agents**: an agent resolves a merge conflict and explains a commit.
- A grid of the rest of the toolkit, and **downloads** for Windows, macOS and Linux.

## Develop

```bash
npm install
```

```bash
npm run dev
```

- `npm test`: unit tests for the download logic (release asset matching, OS detection, caching)
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
picks it up with no change here. Answers are cached in the visitor's session for ten minutes, which keeps
well under GitHub's limit of 60 anonymous API requests an hour.

## Deploy

`.github/workflows/deploy.yml` tests, builds and publishes the site on every push to `main`. One-time
setup: in the repository's **Settings → Pages**, set **Source** to **GitHub Actions**.

The build uses relative paths, so it also works on a custom domain without changes.

## Layout

```
index.html              all of the page's copy (the scenes enhance it; the text reads without JavaScript)
src/main.ts             boot: fonts, styles, smooth scroll, starfield, scenes
src/scenes/             one module per section (hero, graph, integrations, isolate, agents, features, download, footer)
src/lib/                motion settings, smooth scroll, parallax, starfield, the commit-graph renderer, icons
src/downloads/          release fetching and OS detection (pure, unit-tested)
src/styles/             tokens.css (the app's Rookery Space palette) and one stylesheet per section
src/assets/brand/       the Professor, the app icon and the spinner, from the app's rookery-space-assets
```

Built with Vite and TypeScript, [GSAP](https://gsap.com) ScrollTrigger for the scenes and
[Lenis](https://lenis.darkroom.engineering) for smooth scrolling. Provider and OS marks come from
[Simple Icons](https://simpleicons.org).
