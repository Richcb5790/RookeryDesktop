import { describe, expect, it } from 'vitest'
import fixture from '../src/downloads/fixtures/release.json'
import { formatSize, loadRelease, matchAssets, toState, type GithubAsset } from '../src/downloads/releases'

const asset = (name: string): GithubAsset => ({ name, browser_download_url: `https://example.test/${name}`, size: 1 })

class MemoryStorage {
  private m = new Map<string, string>()
  getItem(k: string): string | null {
    return this.m.get(k) ?? null
  }
  setItem(k: string, v: string): void {
    this.m.set(k, v)
  }
}

const respond = (status: number, body?: unknown) => async () => new Response(body === undefined ? null : JSON.stringify(body), { status })

describe('matchAssets', () => {
  it('sorts electron-builder output by operating system and skips update files', () => {
    const d = matchAssets(fixture.assets)
    expect(d.windows.map((x) => x.name)).toEqual(['Rookery-Setup-0.1.0.exe'])
    expect(d.mac.map((x) => [x.label, x.name])).toEqual([
      ['Apple silicon', 'Rookery-0.1.0-arm64.dmg'],
      ['Intel', 'Rookery-0.1.0.dmg']
    ])
    expect(d.linux.map((x) => [x.label, x.format])).toEqual([
      ['AppImage', '.AppImage'],
      ['Debian / Ubuntu', '.deb']
    ])
  })

  it('names a lone dmg by its format rather than guessing the architecture', () => {
    expect(matchAssets([asset('Rookery-1.0.0.dmg')]).mac[0].label).toBe('Disk image')
    expect(matchAssets([asset('Rookery-1.0.0-universal.dmg')]).mac[0].label).toBe('Universal')
  })

  it('puts the Setup installer ahead of other executables', () => {
    const d = matchAssets([asset('Rookery-portable.exe'), asset('Rookery-Setup-1.0.0.exe')])
    expect(d.windows[0].name).toBe('Rookery-Setup-1.0.0.exe')
  })

  it('leaves an operating system empty when the release has nothing for it', () => {
    const d = matchAssets([asset('Rookery-Setup-1.0.0.exe'), asset('latest.yml')])
    expect(d.mac).toEqual([])
    expect(d.linux).toEqual([])
  })
})

describe('toState', () => {
  it('strips the v from the tag', () => {
    const s = toState(fixture)
    expect(s.kind === 'available' && s.version).toBe('0.1.0')
  })
})

describe('loadRelease', () => {
  const url = 'https://api.github.test/releases?per_page=10'

  it('reports no release while the list is empty', async () => {
    expect(await loadRelease({ url, fetch: respond(200, []) })).toEqual({ kind: 'none' })
  })

  it('skips drafts and prereleases', async () => {
    const pre = { ...fixture, tag_name: 'v0.2.0-beta.1', prerelease: true }
    const s = await loadRelease({ url, fetch: respond(200, [pre, fixture]) })
    expect(s.kind === 'available' && s.version).toBe('0.1.0')
    expect(await loadRelease({ url, fetch: respond(200, [pre]) })).toEqual({ kind: 'none' })
  })

  it('reports no release when the repository answers 404', async () => {
    expect(await loadRelease({ url, fetch: respond(404) })).toEqual({ kind: 'none' })
  })

  it("doesn't cache 'none yet', so a release published a moment later shows on the next load", async () => {
    const storage = new MemoryStorage() as unknown as Storage
    expect(await loadRelease({ url, fetch: respond(200, []), storage, now: 0 })).toEqual({ kind: 'none' })
    expect((await loadRelease({ url, fetch: respond(200, [fixture]), storage, now: 1000 })).kind).toBe('available')
  })

  it("ignores a 'none' left in the cache by an older version of the page", async () => {
    const storage = new MemoryStorage() as unknown as Storage
    storage.setItem('rookery.release.v1', JSON.stringify({ at: 0, state: { kind: 'none' } }))
    expect((await loadRelease({ url, fetch: respond(200, [fixture]), storage, now: 1000 })).kind).toBe('available')
  })

  it('reuses a found release inside the cache window', async () => {
    const storage = new MemoryStorage() as unknown as Storage
    await loadRelease({ url, fetch: respond(200, [fixture]), storage, now: 0 })
    const boom = async (): Promise<Response> => {
      throw new Error('should not fetch')
    }
    expect((await loadRelease({ url, fetch: boom, storage, now: 1000 })).kind).toBe('available')
  })

  it('returns the release and its downloads', async () => {
    const s = await loadRelease({ url, fetch: respond(200, [fixture]) })
    expect(s.kind).toBe('available')
    if (s.kind === 'available') expect(s.downloads.windows).toHaveLength(1)
  })

  it('treats a rate limit as an error and does not cache it', async () => {
    const storage = new MemoryStorage() as unknown as Storage
    expect(await loadRelease({ url, fetch: respond(403), storage, now: 0 })).toEqual({ kind: 'error', reason: 'rate-limited' })
    expect((await loadRelease({ url, fetch: respond(200, [fixture]), storage, now: 1 })).kind).toBe('available')
  })

  it('treats a network failure as an error', async () => {
    const offline = async (): Promise<Response> => {
      throw new TypeError('Failed to fetch')
    }
    expect(await loadRelease({ url, fetch: offline })).toEqual({ kind: 'error', reason: 'network' })
  })

  it('fetches again once the cache is stale', async () => {
    const storage = new MemoryStorage() as unknown as Storage
    await loadRelease({ url, fetch: respond(200, [fixture]), storage, now: 0, ttlMs: 100 })
    const newer = { ...fixture, tag_name: 'v0.2.0' }
    const s = await loadRelease({ url, fetch: respond(200, [newer, fixture]), storage, now: 500, ttlMs: 100 })
    expect(s.kind === 'available' && s.version).toBe('0.2.0')
  })
})

describe('formatSize', () => {
  it('rounds to MB', () => {
    expect(formatSize(117102564)).toBe('112 MB')
  })
})
