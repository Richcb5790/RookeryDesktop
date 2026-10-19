import { LINKS } from '../config'
import { browserOs, OS_NAMES, type DesktopOs } from '../downloads/os'
import { formatSize, loadRelease, toState, type GithubRelease, type ReleaseState } from '../downloads/releases'
import { icon } from '../lib/icons'
import { gsap } from '../lib/scroll'

// Downloads come from the latest GitHub release. Until one exists, each card says "coming soon" and
// points at the Releases page, so publishing a release is all it takes to turn the buttons on.

function storage(): Storage | null {
  try {
    return sessionStorage
  } catch {
    return null
  }
}

async function getRelease(): Promise<ReleaseState> {
  const q = new URLSearchParams(location.search).get('release')
  if (import.meta.env.DEV && q) {
    // ?release=fixture | none | error, to see each state before a real release exists.
    if (q === 'none') return { kind: 'none' }
    if (q === 'error') return { kind: 'error', reason: 'test' }
    const fixture = (await import('../downloads/fixtures/release.json')).default as GithubRelease
    return toState(fixture)
  }
  return loadRelease({ url: LINKS.releasesApi, storage: storage() })
}

const dateFmt = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

export function initDownload(reduced: boolean): void {
  const os = browserOs()
  const cards = [...document.querySelectorAll<HTMLElement>('.os-card')]
  const status = document.getElementById('dl-status')!
  const heroBtn = document.getElementById('hero-download') as HTMLAnchorElement
  const heroMeta = document.getElementById('hero-meta')!
  const mascot = document.getElementById('dl-mascot-img')!

  const mine = os === 'windows' || os === 'mac' || os === 'linux' ? os : null
  for (const card of cards) {
    card.classList.toggle('mine', card.dataset.os === mine)
    card.querySelector('.os-actions')!.innerHTML = '<div class="skeleton"></div>'
  }
  if (mine) heroBtn.querySelector('span')!.textContent = `Download for ${OS_NAMES[mine]}`
  if (os === 'mobile') status.textContent = 'Rookery is a desktop app. Open this page on your computer to download it.'

  const launch = (): void => {
    if (reduced) return
    gsap
      .timeline()
      .to(mascot, { y: 10, scaleY: 0.92, duration: 0.15, ease: 'power2.in' })
      .to(mascot, { y: -60, scaleY: 1.04, duration: 0.45, ease: 'power3.out' })
      .to(mascot, { y: 0, scaleY: 1, duration: 0.8, ease: 'bounce.out' })
  }

  const render = (state: ReleaseState): void => {
    status.dataset.state = state.kind
    if (state.kind === 'available') {
      status.textContent = `Version ${state.version}${state.date ? ` · released ${dateFmt.format(new Date(state.date))}` : ''}`
    } else if (state.kind === 'none') {
      status.textContent = 'The first release is on its way. Watch the repository to hear when it lands.'
    } else if (state.kind === 'error') {
      status.textContent = "Couldn't reach GitHub just now. The installers are on the Releases page."
    }
    if (os === 'mobile' && state.kind !== 'loading') status.textContent += ' Rookery runs on Windows, macOS and Linux.'

    for (const card of cards) {
      const key = card.dataset.os as DesktopOs
      const actions = card.querySelector<HTMLElement>('.os-actions')!
      const files = state.kind === 'available' ? state.downloads[key] : []
      if (files.length) {
        actions.innerHTML = files
          .map(
            (f, i) =>
              `<a class="btn ${i === 0 ? 'btn-primary' : 'btn-ghost'}" href="${f.url}" download><span style="display:inline-flex;align-items:center;gap:10px">${icon('download', 17)}${files.length > 1 ? f.label : 'Download'} <small>${f.format}</small></span><small>${formatSize(f.size)}</small></a>`
          )
          .join('')
        actions.querySelectorAll('a').forEach((a) => a.addEventListener('click', launch))
      } else if (state.kind === 'error') {
        actions.innerHTML = `<a class="btn btn-ghost" href="${LINKS.releases}">${icon('external', 16)}See releases on GitHub</a>`
      } else {
        actions.innerHTML = `<span class="btn soon" aria-disabled="true">${icon('rocket', 17)}Coming soon</span><a class="watch" href="${LINKS.repo}">${icon('eye', 15)}Watch releases on GitHub</a>`
      }
    }

    // The hero button goes straight to the installer when there is one for this computer.
    const file = mine && state.kind === 'available' ? state.downloads[mine][0] : undefined
    if (file) {
      heroBtn.href = file.url
      heroBtn.setAttribute('download', '')
      heroMeta.textContent = `Version ${state.kind === 'available' ? state.version : ''} for ${OS_NAMES[mine!]} · ${formatSize(file.size)} · Needs Git 2.40+`
    }
  }

  getRelease().then(render, () => render({ kind: 'error', reason: 'unexpected' }))
}
