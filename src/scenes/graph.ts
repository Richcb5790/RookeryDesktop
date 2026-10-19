import { icon } from '../lib/icons'
import { offsetWithin, primeEdges, renderGraph, type Commit, type Metrics } from '../lib/graph'
import { DESKTOP, MOBILE } from '../lib/motion'
import { gsap, ScrollTrigger } from '../lib/scroll'
import { TOUR } from './graphData'
import { pinnedSteps } from './steps'

const SHAS: Record<string, string> = {
  m5: 'a41f0c2', t4: '3be9d17', s1: 'f0c55a8', t3: '9d27e41', d2: '62ab0f3', t2: 'c8e1d90',
  d1: '1f4a7bb', m4: 'e7730d2', t1: '5c90e6a', m3: 'b2d4c18', m2: '0e6f3a9', m1: '7a12c40'
}

export function pill(c: Commit, name: string, head = false, color = c.color): string {
  return `<span class="ref-pill${head ? ' head' : ''}" data-ref="${name}" style="--pill: var(--lane-${color})">${head ? icon('check', 12) : icon('branch', 12)}${name}</span>`
}

/** Builds the HTML rows (labels + messages) that sit over a graph svg. */
export function renderRows(el: HTMLElement, commits: Commit[]): void {
  el.innerHTML = commits
    .map(
      (c) =>
        `<div class="g-row${c.parents.length > 1 ? ' merge' : ''}" data-id="${c.id}" data-c="${c.color}"><div class="g-refs">${(c.refs ?? [])
          .map((r) => pill(c, r.name, r.head, r.color))
          .join('')}</div><div></div><div class="g-msg">${c.msg}</div></div>`
    )
    .join('')
}

/** Hovering a row or node lights up its line and shows the commit; everything else dims. */
export function hoverLanes(body: HTMLElement, svg: SVGSVGElement, tip: HTMLElement | null, commits: Commit[], shas: Record<string, string> = {}): void {
  const byId = new Map(commits.map((c) => [c.id, c]))
  const clear = (): void => {
    svg.classList.remove('focus')
    svg.querySelectorAll('.dim').forEach((e) => e.classList.remove('dim'))
    body.querySelectorAll('.g-row.hot').forEach((e) => e.classList.remove('hot'))
    if (tip) tip.hidden = true
  }
  body.addEventListener('pointerover', (e) => {
    const row = (e.target as Element).closest<HTMLElement>('.g-row')
    if (!row || body.dataset.busy) return
    const c = byId.get(row.dataset.id!)
    if (!c) return
    clear()
    svg.classList.add('focus')
    svg.querySelectorAll<SVGElement>('[data-c]').forEach((n) => {
      if (n.dataset.c !== String(c.color)) n.classList.add('dim')
    })
    body.querySelectorAll<HTMLElement>(`.g-row[data-c="${c.color}"]`).forEach((r) => r.classList.add('hot'))
    const dot = svg.querySelector(`.g-node[data-id="${c.id}"]`)
    if (tip && dot) {
      tip.innerHTML = `<b>${c.msg}</b><span>${c.author}${shas[c.id] ? ` · ${shas[c.id]}` : ''}</span>`
      tip.hidden = false
      const nb = dot.getBoundingClientRect()
      const bb = body.getBoundingClientRect()
      tip.style.left = `${nb.right - bb.left + 10}px`
      tip.style.top = `${nb.top - bb.top - 50}px`
    }
  })
  body.addEventListener('pointerleave', clear)
}

export function initGraph(reduced: boolean): void {
  const section = document.getElementById('graph')!
  const body = document.getElementById('graph-body')!
  const svg = document.getElementById('graph-svg') as unknown as SVGSVGElement
  const rows = document.getElementById('graph-rows')!
  const tip = document.getElementById('graph-tip')!
  const win = section.querySelector<HTMLElement>('.graph-window')!

  const mobile = matchMedia(MOBILE).matches
  const m: Metrics = { rowH: mobile ? 30 : 34, laneW: 20, x0: 14, y0: (mobile ? 30 : 34) / 2 }
  win.style.setProperty('--row-h', `${m.rowH}px`)
  svg.setAttribute('width', '96')
  svg.setAttribute('height', String(TOUR.length * m.rowH))
  renderGraph(svg, TOUR, m)
  renderRows(rows, TOUR)
  hoverLanes(body, svg, tip, TOUR, SHAS)

  // A drop menu for the drag demo, next to develop's row.
  const menu = document.createElement('div')
  menu.className = 'drop-menu'
  menu.innerHTML = `
    <div>${icon('merge', 15)}Merge <b>feature/sensors</b> into <b>develop</b></div>
    <div>${icon('reorder', 15)}Rebase <b>feature/sensors</b> onto <b>develop</b></div>
    <div>${icon('reorder', 15)}Interactive rebase…</div>
    <div>${icon('pr', 15)}Create pull request into <b>develop</b></div>`
  body.appendChild(menu)

  if (reduced) return

  const node = (id: string): Element => svg.querySelector(`.g-node[data-id="${id}"]`)!
  const row = (id: string): HTMLElement => rows.querySelector<HTMLElement>(`.g-row[data-id="${id}"]`)!
  const edgesOf = (id: string): Element[] => [...svg.querySelectorAll(`.g-edge[data-from="${id}"]`)]
  const pillOf = (id: string): HTMLElement => row(id).querySelector<HTMLElement>('.ref-pill')!

  primeEdges(svg, true)
  gsap.set(svg.querySelectorAll('.g-node'), { scale: 0, transformOrigin: '50% 50%' })
  gsap.set(rows.querySelectorAll('.g-row'), { opacity: 0, x: 18 })

  const appear = (tl: gsap.core.Timeline, c: Commit, at: number): void => {
    const edges = edgesOf(c.id)
    if (edges.length) tl.to(edges, { strokeDashoffset: 0, duration: 0.9, ease: 'power1.inOut' }, at)
    tl.to(node(c.id), { scale: 1, duration: 0.5, ease: 'back.out(2.6)' }, at + 0.55)
    tl.to(row(c.id), { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' }, at + 0.55)
  }

  const oldestFirst = [...TOUR].reverse()
  const commitsOnly = oldestFirst.filter((c) => c.parents.length < 2)
  const merges = oldestFirst.filter((c) => c.parents.length > 1)

  const visual = section.querySelector<HTMLElement>('.stage-visual')!
  const dock = (fp: string, targetId: string, tl: gsap.core.Timeline, at: number): void => {
    const el = visual.querySelector<HTMLElement>(fp)!
    const inner = el.querySelector<HTMLElement>('.ref-pill')!
    const delta = (): { x: number; y: number } => {
      const to = offsetWithin(pillOf(targetId), visual)
      const from = offsetWithin(inner, visual)
      return { x: to.x - from.x, y: to.y - from.y }
    }
    tl.to(el, { x: () => delta().x, y: () => delta().y, scale: 0.82, duration: 1, ease: 'power3.inOut' }, at)
    tl.to(el, { opacity: 0, duration: 0.25 }, at + 0.85)
  }

  /** Wide screens dock the floating labels and show the drag; phones hide the label column. */
  const build = (tl: gsap.core.Timeline, wide: boolean): Record<string, number> => {
    // 1 · lanes: every non-merge commit, oldest first
    commitsOnly.forEach((c, i) => appear(tl, c, i * 0.42))
    const t1 = commitsOnly.length * 0.42 + 0.8
    // 2 · merges curve home
    merges.forEach((c, i) => appear(tl, c, t1 + i * 0.9))
    if (wide) {
      dock('.fp-3', 'd2', tl, t1 - 0.2)
      dock('.fp-2', 't4', tl, t1 + 0.7)
      dock('.fp-1', 'm5', tl, t1 + 1.6)
    }
    const t2 = t1 + merges.length * 0.9 + 0.9
    if (!wide) return { lanes: 0, merges: t1, drag: t2 }
    // 3 · drag feature/sensors onto develop
    const ghost = document.getElementById('drag-ghost')!
    const from = (): { x: number; y: number } => offsetWithin(pillOf('s1'), body)
    const to = (): { x: number; y: number } => {
      const p = offsetWithin(pillOf('d2'), body)
      return { x: p.x - 30, y: p.y + 6 }
    }
    tl.set(ghost, { x: () => from().x, y: () => from().y, opacity: 0 }, t2)
    tl.to(ghost, { opacity: 1, scale: 1.06, duration: 0.3 }, t2)
    tl.to(pillOf('s1'), { opacity: 0.35, duration: 0.3 }, t2)
    tl.to(ghost, { x: () => to().x, y: () => to().y, duration: 1.4, ease: 'power2.inOut' }, t2 + 0.3)
    tl.fromTo(
      pillOf('d2'),
      { boxShadow: '0 0 0 0px rgba(255,201,60,0), 0 0 0px rgba(255,201,60,0)' },
      { boxShadow: '0 0 0 3px rgba(255,201,60,0.6), 0 0 22px rgba(255,201,60,0.65)', duration: 0.3 },
      t2 + 1.35
    )
    tl.set(menu, { left: () => offsetWithin(pillOf('d2'), body).x + 20, top: () => offsetWithin(pillOf('d2'), body).y + 26 }, t2 + 1.5)
    tl.fromTo(menu, { opacity: 0, y: -8, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(2)' }, t2 + 1.6)
    tl.to(ghost, { opacity: 0, duration: 0.3 }, t2 + 1.7)
    // "Merge" is picked: the menu closes and the labels settle, so the finished graph is clear to explore.
    tl.to(menu.firstElementChild, { scale: 0.97, duration: 0.15, yoyo: true, repeat: 1 }, t2 + 2.5)
    tl.to(menu, { opacity: 0, y: -6, duration: 0.35 }, t2 + 2.85)
    tl.to(pillOf('d2'), { boxShadow: '0 0 0 0px rgba(255,201,60,0), 0 0 0px rgba(255,201,60,0)', duration: 0.4 }, t2 + 2.9)
    tl.to(pillOf('s1'), { opacity: 1, duration: 0.4 }, t2 + 2.9)
    tl.to({}, { duration: 0.8 })
    return { lanes: 0, merges: t1, drag: t2 }
  }

  const mm = gsap.matchMedia()
  mm.add(DESKTOP, () => {
    const tl = gsap.timeline({ defaults: { ease: 'none' } })
    const labels = build(tl, true)
    pinnedSteps(section, tl, [labels.lanes, labels.merges, labels.drag], '+=260%', body)
  })
  mm.add(MOBILE, () => {
    const tl = gsap.timeline({ paused: true })
    build(tl, false)
    tl.timeScale(1.6)
    ScrollTrigger.create({ trigger: win, start: 'top 75%', once: true, onEnter: () => tl.play() })
  })
}
