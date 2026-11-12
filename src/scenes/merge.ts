import { hl } from '../lib/code'
import { ScrollTrigger } from '../lib/scroll'
import { sleep } from '../lib/motion'

// A working miniature of Rookery's merge editor: Yours and Theirs side by side over the Result.
// Clicking a conflicting line picks it; picks land in the Result in the order they were made, each
// labelled with the side it came from. It plays itself once when it scrolls into view, then it's
// the visitor's to try.

type Side = 'yours' | 'theirs'

interface Pick {
  side: Side
  i: number
}

const BEFORE = ['export function countdown(seconds: number) {']
const AFTER = ['}']
const CONFLICT: Record<Side, string[]> = {
  yours: ['  const clamped = Math.max(0, seconds)', '  return formatTime(clamped)'],
  theirs: ["  telemetry.track('countdown', seconds)", '  return formatTime(seconds)']
}
const BRANCH: Record<Side, string> = { yours: 'main', theirs: 'feature/telemetry' }

/** One line of a pane. `box` is what its tick box shows: the pick's number, once picked. */
const row = (num: number | string, code: string, cls = '', extra = '', box = ''): string =>
  `<div class="mg-ln ${cls}"${extra}><i class="mg-box">${box}</i><i class="mg-num">${num}</i><span class="mg-src">${code}</span></div>`

export function initMerge(reduced: boolean): void {
  const win = document.getElementById('mg-window')
  if (!win) return
  const panes: Record<Side, HTMLElement> = {
    yours: document.getElementById('mg-yours')!,
    theirs: document.getElementById('mg-theirs')!
  }
  const all: Record<Side, HTMLInputElement> = {
    yours: document.getElementById('mg-all-yours') as HTMLInputElement,
    theirs: document.getElementById('mg-all-theirs') as HTMLInputElement
  }
  const result = document.getElementById('mg-result')!
  const status = document.getElementById('mg-status')!
  const progress = document.getElementById('mg-progress')!
  const count = document.getElementById('mg-count')!
  const save = document.getElementById('mg-save')!
  const hint = document.getElementById('mg-hint')!

  let picks: Pick[] = []
  /** "Neither": the conflict is settled by taking no line from either side. */
  let neither = false
  /** The pick made most recently, so its Result line can flash in. */
  let fresh = -1

  const order = (side: Side, i: number): number => picks.findIndex((p) => p.side === side && p.i === i)

  function renderSide(side: Side): void {
    const first = BEFORE.length + 1
    panes[side].innerHTML =
      BEFORE.map((t, k) => row(k + 1, hl(t))).join('') +
      CONFLICT[side]
        .map((t, i) => {
          const n = order(side, i)
          const label = `${n >= 0 ? 'Unpick' : 'Pick'} line ${first + i} from ${side === 'yours' ? 'Yours' : 'Theirs'}`
          return row(
            first + i,
            hl(t),
            `pickable${n >= 0 ? ' picked' : ''}`,
            ` data-side="${side}" data-i="${i}" role="checkbox" aria-checked="${n >= 0}" aria-label="${label}" tabindex="0"`,
            n >= 0 ? String(n + 1) : ''
          )
        })
        .join('') +
      AFTER.map((t, k) => row(first + CONFLICT[side].length + k, hl(t))).join('')
    const taken = CONFLICT[side].filter((_, i) => order(side, i) >= 0).length
    all[side].checked = taken === CONFLICT[side].length
    all[side].indeterminate = taken > 0 && taken < CONFLICT[side].length
  }

  function renderResult(): void {
    const resolved = neither || picks.length > 0
    let n = 0
    const out: string[] = BEFORE.map((t) => row(++n, hl(t)))
    if (picks.length) {
      picks.forEach((p, k) =>
        out.push(row(++n, hl(CONFLICT[p.side][p.i]), `from-${p.side}${k === fresh ? ' fresh' : ''}`, ` data-origin="${p.side}"`))
      )
    } else if (!neither) {
      out.push(row(++n, '&lt;&lt;&lt;&lt;&lt;&lt;&lt; yours', 'marker'))
      for (const t of CONFLICT.yours) out.push(row(++n, hl(t), 'dim'))
      out.push(row(++n, '=======', 'marker'))
      for (const t of CONFLICT.theirs) out.push(row(++n, hl(t), 'dim'))
      out.push(row(++n, `&gt;&gt;&gt;&gt;&gt;&gt;&gt; ${BRANCH.theirs}`, 'marker'))
    }
    for (const t of AFTER) out.push(row(++n, hl(t)))
    result.innerHTML = out.join('')
    fresh = -1

    const state = resolved ? 'done' : 'open'
    status.dataset.state = state
    status.textContent = resolved ? 'Resolved' : 'Unresolved'
    progress.dataset.state = state
    count.textContent = `${resolved ? 1 : 0} of 1 resolved`
    save.classList.toggle('ready', resolved)
  }

  function render(): void {
    renderSide('yours')
    renderSide('theirs')
    renderResult()
  }

  function toggle(side: Side, i: number): void {
    const at = order(side, i)
    neither = false
    if (at >= 0) picks.splice(at, 1)
    else {
      picks.push({ side, i })
      fresh = picks.length - 1
    }
    render()
  }

  // The demo plays itself until the visitor takes over; any real input stops it for good.
  let auto = true
  const takeOver = (): void => {
    auto = false
    hint.classList.add('gone')
  }

  for (const side of ['yours', 'theirs'] as Side[]) {
    const act = (target: EventTarget | null): void => {
      const el = (target as Element).closest<HTMLElement>('.pickable')
      if (!el) return
      takeOver()
      toggle(side, Number(el.dataset.i))
      // The pane was redrawn, so put focus back on the line that was acted on.
      panes[side].querySelector<HTMLElement>(`.pickable[data-i="${el.dataset.i}"]`)?.focus({ preventScroll: true })
    }
    panes[side].addEventListener('click', (e) => act(e.target))
    panes[side].addEventListener('keydown', (e) => {
      if (e.key !== ' ' && e.key !== 'Enter') return
      e.preventDefault()
      act(e.target)
    })
    all[side].addEventListener('change', () => {
      takeOver()
      neither = false
      picks = picks.filter((p) => p.side !== side)
      if (all[side].checked) CONFLICT[side].forEach((_, i) => picks.push({ side, i }))
      render()
    })
  }
  document.getElementById('mg-neither')!.addEventListener('click', () => {
    takeOver()
    picks = []
    neither = true
    render()
  })
  document.getElementById('mg-clear')!.addEventListener('click', () => {
    takeOver()
    picks = []
    neither = false
    render()
  })

  render()
  if (reduced) return

  // The resolution both sides would agree on: the clamp from Yours, then the tracking call from
  // Theirs, then Yours' return.
  const script: Pick[] = [
    { side: 'yours', i: 0 },
    { side: 'theirs', i: 0 },
    { side: 'yours', i: 1 }
  ]
  ScrollTrigger.create({
    trigger: win,
    start: 'top 62%',
    once: true,
    onEnter: async () => {
      await sleep(700)
      for (const p of script) {
        if (!auto) return
        const el = panes[p.side].querySelector<HTMLElement>(`.pickable[data-i="${p.i}"]`)
        el?.classList.add('poke')
        await sleep(420)
        if (!auto) return
        toggle(p.side, p.i)
        await sleep(520)
      }
    }
  })
}
