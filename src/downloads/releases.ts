import type { DesktopOs } from './os'

/** The fields of a GitHub release (REST API) that the site reads. */
export interface GithubAsset {
  name: string
  browser_download_url: string
  size: number
}

export interface GithubRelease {
  tag_name: string
  name: string | null
  html_url: string
  published_at: string | null
  draft?: boolean
  prerelease?: boolean
  assets: GithubAsset[]
}

export interface Download {
  name: string
  url: string
  size: number
  /** What the button says, e.g. "Apple silicon" or "AppImage" */
  label: string
  /** File extension shown beside the label, e.g. ".dmg" */
  format: string
}

export type Downloads = Record<DesktopOs, Download[]>

export type ReleaseState =
  | { kind: 'loading' }
  | { kind: 'available'; version: string; date: string | null; url: string; downloads: Downloads }
  /** No release yet */
  | { kind: 'none' }
  /** Couldn't ask: offline, blocked, or over GitHub's 60 requests an hour */
  | { kind: 'error'; reason: string }

const ext = (name: string): string => /\.[^.]+$/.exec(name)?.[0].toLowerCase() ?? ''

/** Sorts a release's assets into installers per operating system. Blockmaps, update feeds and the like are skipped. */
export function matchAssets(assets: GithubAsset[]): Downloads {
  const out: Downloads = { windows: [], mac: [], linux: [] }
  const dl = (a: GithubAsset, label: string): Download => ({
    name: a.name,
    url: a.browser_download_url,
    size: a.size,
    label,
    // As the file spells it, so ".AppImage" keeps its capitals
    format: /\.[^.]+$/.exec(a.name)?.[0] ?? ''
  })

  const exe = assets.filter((a) => ['.exe', '.msi'].includes(ext(a.name)))
  // Installers first: electron-builder names the NSIS one "<product>-Setup-<version>.exe".
  exe.sort((a, b) => Number(/setup/i.test(b.name)) - Number(/setup/i.test(a.name)))
  for (const a of exe) out.windows.push(dl(a, /arm64/i.test(a.name) ? 'Windows on Arm' : ext(a.name) === '.msi' ? 'MSI installer' : 'Installer'))

  const dmg = assets.filter((a) => ext(a.name) === '.dmg')
  const split = dmg.some((a) => /arm64/i.test(a.name))
  for (const a of dmg) {
    const label = /universal/i.test(a.name)
      ? 'Universal'
      : /arm64/i.test(a.name)
        ? 'Apple silicon'
        : split || /x64|intel/i.test(a.name)
          ? 'Intel'
          : 'Disk image'
    out.mac.push(dl(a, label))
  }
  const macOrder = ['Universal', 'Apple silicon', 'Intel', 'Disk image']
  out.mac.sort((a, b) => macOrder.indexOf(a.label) - macOrder.indexOf(b.label))

  const linux: Record<string, string> = { '.appimage': 'AppImage', '.deb': 'Debian / Ubuntu', '.rpm': 'Fedora / openSUSE' }
  for (const a of assets) {
    const label = linux[ext(a.name)]
    if (label) out.linux.push(dl(a, /arm64|aarch64/i.test(a.name) ? `${label} (Arm)` : label))
  }
  return out
}

export function toState(r: GithubRelease): ReleaseState {
  return {
    kind: 'available',
    version: r.tag_name.replace(/^v/i, ''),
    date: r.published_at,
    url: r.html_url,
    downloads: matchAssets(r.assets)
  }
}

interface Cached {
  at: number
  state: ReleaseState
}

const CACHE_KEY = 'rookery.release.v1'

function readCache(storage: Storage | null, now: number, ttl: number): ReleaseState | null {
  try {
    const raw = storage?.getItem(CACHE_KEY)
    if (!raw) return null
    const c = JSON.parse(raw) as Cached
    return now - c.at < ttl ? c.state : null
  } catch {
    return null
  }
}

function writeCache(storage: Storage | null, now: number, state: ReleaseState): void {
  try {
    storage?.setItem(CACHE_KEY, JSON.stringify({ at: now, state } satisfies Cached))
  } catch {
    // Private windows and blocked storage just skip the cache.
  }
}

export interface LoadOptions {
  url: string
  fetch?: typeof fetch
  storage?: Storage | null
  now?: number
  /** How long an answer is reused, to stay well under the API's rate limit. */
  ttlMs?: number
}

/**
 * Asks GitHub for the repository's releases and takes the newest that is neither a draft nor a
 * prerelease. Answers (including "none yet") are cached; failures aren't.
 */
export async function loadRelease(o: LoadOptions): Promise<ReleaseState> {
  const now = o.now ?? Date.now()
  const storage = o.storage ?? null
  const cached = readCache(storage, now, o.ttlMs ?? 10 * 60_000)
  if (cached) return cached

  let res: Response
  try {
    res = await (o.fetch ?? fetch)(o.url, { headers: { Accept: 'application/vnd.github+json' } })
  } catch {
    return { kind: 'error', reason: 'network' }
  }
  if (res.status === 404) {
    const state: ReleaseState = { kind: 'none' }
    writeCache(storage, now, state)
    return state
  }
  if (res.status === 403 || res.status === 429) return { kind: 'error', reason: 'rate-limited' }
  if (!res.ok) return { kind: 'error', reason: `http ${res.status}` }
  let list: GithubRelease[]
  try {
    list = (await res.json()) as GithubRelease[]
    if (!Array.isArray(list)) throw new Error('not a list')
  } catch {
    return { kind: 'error', reason: 'bad response' }
  }
  const latest = list.find((r) => !r.draft && !r.prerelease)
  const state: ReleaseState = latest ? toState(latest) : { kind: 'none' }
  writeCache(storage, now, state)
  return state
}

export function formatSize(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`
  if (bytes >= 1024 ** 2) return `${Math.round(bytes / 1024 ** 2)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}
