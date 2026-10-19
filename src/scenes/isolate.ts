import { edgeMarkup, laneX, layoutEdges, nodeMarkup, offsetWithin, rowY, type Metrics } from '../lib/graph'
import { DESKTOP, MOBILE } from '../lib/motion'
import { gsap, ScrollTrigger } from '../lib/scroll'
import { renderRows } from './graph'
import { BUSY, ISOLATED, SPINE } from './graphData'
import { pinnedSteps } from './steps'

// Isolate mode, told in four beats: a crowded graph; a lighthouse beam finds feature/docking and
// everything unrelated falls away while its commits glide into lane 0; the map; the timeline.

const M: Metrics = { rowH: 22, laneW: 18, x0: 12, y0: 11 }

const MAP = `
<defs>
  <marker id="m-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
    <path d="M0 0 L10 5 L0 10 z" fill="var(--accent)"/>
  </marker>
</defs>
<text class="m-title m-fade" x="268" y="44" text-anchor="middle">feature/docking</text>
<path class="m-draw m-spine" d="M268 70 V180" stroke="var(--lane-2)" stroke-width="5" stroke-linecap="round" fill="none"/>
<path class="m-draw m-spine" d="M268 180 V250" stroke="var(--lane-2)" stroke-width="5" stroke-dasharray="1 9" stroke-linecap="round" fill="none"/>
<path class="m-draw m-spine" d="M268 250 V392" stroke="var(--lane-2)" stroke-width="5" stroke-linecap="round" fill="none"/>
<g class="m-in">
  <rect x="24" y="56" width="168" height="30" rx="15" fill="var(--bg)" stroke="var(--lane-3)" stroke-width="2"/>
  <text class="m-pill-text" x="40" y="75.5">feature/sensors</text>
  <text class="m-count" x="160" y="75" style="font-style:normal">+2</text>
  <path class="m-draw" d="M192 71 C226 71 236 72 256 72" stroke="var(--lane-3)" stroke-width="2.5" fill="none"/>
</g>
<g class="m-out">
  <path class="m-draw" d="M282 72 H346" stroke="var(--accent)" stroke-width="3" fill="none" marker-end="url(#m-arrow)"/>
  <rect x="354" y="56" width="168" height="32" rx="16" fill="rgba(255,201,60,.08)" stroke="var(--accent)" stroke-width="2"/>
  <text class="m-pill-text" x="372" y="76.5">→ main</text>
</g>
<g class="m-out">
  <path class="m-draw" d="M282 250 H346" stroke="var(--accent)" stroke-width="3" fill="none" marker-end="url(#m-arrow)"/>
  <rect x="354" y="234" width="168" height="32" rx="16" fill="rgba(255,201,60,.08)" stroke="var(--accent)" stroke-width="2"/>
  <text class="m-pill-text" x="372" y="254.5">→ develop</text>
</g>
<g class="m-fade">
  <text class="m-label" x="286" y="106"><tspan class="sha">16855be</tspan> Merge branch 'feature/sensors'…</text>
  <text class="m-count" x="286" y="160">1 commit</text>
  <text class="m-label" x="286" y="282"><tspan class="sha">c5cc477</tspan> Retry the handshake on timeout</text>
  <text class="m-count" x="286" y="336">3 commits</text>
  <text class="m-label" x="286" y="396"><tspan class="sha">7157e20</tspan> Document the docking API</text>
</g>
<circle class="m-node" cx="268" cy="72" r="11" fill="var(--lane-2)" stroke="var(--bg)" stroke-width="3"/>
<circle class="m-node" cx="268" cy="250" r="9" fill="var(--lane-2)" stroke="var(--bg)" stroke-width="3"/>
<circle class="m-node" cx="268" cy="392" r="9" fill="var(--lane-0)" stroke="var(--bg)" stroke-width="3"/>
<g class="m-root">
  <path class="m-draw" d="M262 400 C240 424 200 426 180 432" stroke="var(--success)" stroke-width="3" fill="none"/>
  <rect x="24" y="420" width="156" height="30" rx="15" fill="rgba(110,231,183,.08)" stroke="var(--success)" stroke-width="2"/>
  <text class="m-pill-text" x="42" y="439.5">from main</text>
</g>`

export function initIsolate(reduced: boolean): void {
  const section = document.getElementById('isolate')!
  const win = document.getElementById('iso-window')!
  const graphEl = document.getElementById('iso-graph')!
  const head = graphEl.previousElementSibling as HTMLElement
  const svg = document.getElementById('iso-svg') as unknown as SVGSVGElement
  const rows = document.getElementById('iso-rows')!
  const map = document.getElementById('iso-map') as unknown as SVGSVGElement
  const panel = document.getElementById('iso-timeline')!
  const bar = document.getElementById('lineage-bar')!
  const btn = document.getElementById('iso-btn')!
  const beam = document.getElementById('iso-beam')!
  const tabs = [...document.querySelectorAll<HTMLButtonElement>('#iso-tabs button')]

  // Both layouts in one svg: the full graph's edges, the isolated graph's edges, and one set of
  // nodes that moves between them.
  const isoRow = new Map(ISOLATED.map((c, i) => [c.id, i]))
  const isoLane = new Map(ISOLATED.map((c) => [c.id, c.lane]))
  const isoEdges = layoutEdges(ISOLATED, M)
  svg.setAttribute('width', '150')
  svg.setAttribute('height', String(BUSY.length * M.rowH))
  svg.innerHTML =
    `<g class="g-edges full">${layoutEdges(BUSY, M).map(edgeMarkup).join('')}</g>` +
    `<g class="g-edges iso">${isoEdges.map(edgeMarkup).join('')}</g>` +
    `<g class="g-nodes">${BUSY.map((c, i) => nodeMarkup(c, laneX(c.lane, M), rowY(i, M), 5, { plain: true })).join('')}</g>`
  renderRows(rows, BUSY)
  map.innerHTML = MAP

  const fullEdges = svg.querySelector('.g-edges.full')!
  const isoPaths = [...svg.querySelectorAll<SVGPathElement>('.g-edges.iso .g-edge')]
  const nodes = [...svg.querySelectorAll<SVGGElement>('.g-node')]
  const rowEls = [...rows.querySelectorAll<HTMLElement>('.g-row')]
  const inSubset = (id: string): boolean => isoRow.has(id)
  const tipPill = rows.querySelector<HTMLElement>('.g-row[data-id="k5"] .ref-pill')!
  const entries = [...panel.querySelectorAll('li')]

  for (const p of isoPaths) {
    const len = Math.ceil(p.getTotalLength()) + 1
    p.style.strokeDasharray = `${len} ${len}`
    p.style.strokeDashoffset = `${-len}`
    const from = p.dataset.from!
    if (!SPINE.has(from) || !SPINE.has(p.dataset.to!)) p.style.opacity = '0.5'
  }

  // ---- Graph ↔ map. Tabs switch it any time once isolated; scrolling flips it at the map step.
  let view: 'graph' | 'map' = 'graph'
  const mapDraws = [...map.querySelectorAll<SVGPathElement>('.m-draw')]
  for (const p of mapDraws) {
    const len = Math.ceil(p.getTotalLength()) + 1
    if (!p.getAttribute('stroke-dasharray')) {
      p.style.strokeDasharray = `${len} ${len}`
      p.dataset.len = String(len)
    }
  }
  const mapIntro = gsap
    .timeline({ paused: true })
    .fromTo(map.querySelectorAll('.m-spine'), { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.15 }, 0)
    .fromTo(mapDraws.filter((p) => p.dataset.len), { strokeDashoffset: (_i: number, p: SVGPathElement) => p.dataset.len! }, { strokeDashoffset: 0, duration: 0.8, stagger: 0.06, ease: 'power2.out' }, 0.1)
    .fromTo(map.querySelectorAll('.m-node'), { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(2.4)' }, 0.2)
    .fromTo(map.querySelectorAll('.m-in'), { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, 0.3)
    .fromTo(map.querySelectorAll('.m-out'), { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, stagger: 0.15, ease: 'power3.out' }, 0.4)
    .fromTo(map.querySelectorAll('.m-root'), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, 0.5)
    .fromTo(map.querySelectorAll('.m-fade'), { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.6)

  const setView = (v: 'graph' | 'map', instant = false): void => {
    if (v === view) return
    view = v
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.view === v)))
    const d = instant ? 0 : 0.45
    if (v === 'map') {
      gsap.to([head, graphEl], { opacity: 0, y: 12, duration: d, overwrite: 'auto' })
      gsap.to(map, { opacity: 1, duration: d, overwrite: 'auto' })
      if (instant) mapIntro.progress(1)
      else mapIntro.restart()
    } else {
      gsap.to([head, graphEl], { opacity: 1, y: 0, duration: d, overwrite: 'auto' })
      gsap.to(map, { opacity: 0, duration: d * 0.8, overwrite: 'auto' })
    }
  }
  tabs.forEach((t) => t.addEventListener('click', () => setView(t.dataset.view as 'graph' | 'map')))

  // ---- The isolate story as one timeline (scrubbed by scroll on wide screens).
  const build = (tl: gsap.core.Timeline): number[] => {
    // 1 · Crowded: each line of work flashes in turn.
    for (let lane = 1; lane < 7; lane++) {
      const lit = nodes.filter((n) => n.dataset.c === String(lane))
      tl.to(lit, { scale: 1.6, transformOrigin: '50% 50%', duration: 0.18, yoyo: true, repeat: 1 }, 0.2 + lane * 0.16)
    }

    // 2 · The beam sweeps in and lands on feature/docking.
    const t1 = 1.6
    const aim = (): number => {
      const g = { x: graphEl.clientWidth, y: -50 + 60 }
      const p = offsetWithin(tipPill, graphEl)
      const dx = p.x + tipPill.offsetWidth / 2 - g.x
      const dy = p.y + tipPill.offsetHeight / 2 - g.y
      return (Math.atan2(-dy, -dx) * 180) / Math.PI
    }
    tl.fromTo(beam, { rotation: () => aim() - 28, opacity: 0 }, { rotation: () => aim() - 10, opacity: 1, duration: 0.6, ease: 'power1.out' }, t1)
    tl.to(beam, { rotation: () => aim(), duration: 0.9, ease: 'power2.inOut' }, t1 + 0.6)
    tl.fromTo(tipPill, { boxShadow: '0 0 0 0px rgba(255,201,60,0), 0 0 0px rgba(255,201,60,0)' }, { boxShadow: '0 0 0 2px rgba(255,201,60,0.8), 0 0 26px rgba(255,201,60,0.7)', duration: 0.4 }, t1 + 1.2)
    tl.fromTo(btn, { backgroundColor: 'rgba(255,201,60,0)', color: '#D9DFEA' }, { backgroundColor: 'rgba(255,201,60,0.18)', color: '#FFC93C', duration: 0.3 }, t1 + 1.5)
    tl.to(bar, { height: 'auto', paddingTop: 10, paddingBottom: 10, opacity: 1, borderBottomColor: 'rgba(46,63,114,0.8)', duration: 0.6, ease: 'power2.inOut' }, t1 + 1.7)

    // Everything unrelated falls away; the branch's own line glides to lane 0.
    const t2 = t1 + 1.9
    tl.to(fullEdges, { opacity: 0.05, duration: 0.9, ease: 'power1.in' }, t2)
    tl.to(win, { '--graph-w': '76px', duration: 1.2, ease: 'power2.inOut' }, t2 + 0.2)
    nodes.forEach((n) => {
      const id = n.dataset.id!
      if (inSubset(id)) {
        tl.to(n, { x: laneX(isoLane.get(id)!, M), y: rowY(isoRow.get(id)!, M), scale: SPINE.has(id) ? 1.25 : 1, opacity: SPINE.has(id) ? 1 : 0.6, duration: 1.3, ease: 'power3.inOut' }, t2 + 0.2)
      } else {
        tl.to(n, { opacity: 0, scale: 0.4, transformOrigin: '50% 50%', duration: 0.6 }, t2 + Math.random() * 0.3)
      }
    })
    BUSY.forEach((c, i) => {
      const el = rowEls[i]
      if (inSubset(c.id)) {
        tl.to(el, { y: (isoRow.get(c.id)! - i) * M.rowH, opacity: SPINE.has(c.id) ? 1 : 0.55, duration: 1.3, ease: 'power3.inOut' }, t2 + 0.2)
      } else {
        tl.to(el, { opacity: 0, x: -14, duration: 0.5 }, t2 + Math.random() * 0.3)
      }
    })
    tl.to(isoPaths, { strokeDashoffset: 0, duration: 0.8, stagger: 0.05, ease: 'power1.inOut' }, t2 + 1.3)
    tl.to(beam, { opacity: 0, duration: 0.8 }, t2 + 1.4)
    tl.to(tipPill, { boxShadow: '0 0 0 1px rgba(255,201,60,0.6), 0 0 14px rgba(255,201,60,0.3)', duration: 0.6 }, t2 + 1.4)

    // 3 · The map (switched by setView as the scroll passes this point).
    const t3 = t2 + 2.6
    tl.to({}, { duration: 1.6 }, t3)

    // 4 · The timeline panel opens and its facts arrive one by one.
    const t4 = t3 + 1.8
    tl.to(panel, { width: 250, duration: 0.8, ease: 'power3.inOut' }, t4)
    tl.fromTo(entries, { opacity: 0, x: 18 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.22, ease: 'power2.out' }, t4 + 0.4)
    tl.to({}, { duration: 1 })
    return [0, t1, t3, t4]
  }

  if (reduced) {
    const tl = gsap.timeline({ paused: true })
    build(tl)
    tl.progress(1)
    gsap.set(beam, { opacity: 0 })
    setView('map', true)
    return
  }

  gsap.set(entries, { opacity: 0 })
  const mm = gsap.matchMedia()
  mm.add(DESKTOP, () => {
    const tl = gsap.timeline({ defaults: { ease: 'none' } })
    const starts = build(tl)
    let auto: 'graph' | 'map' = 'graph'
    pinnedSteps(section, tl, starts, '+=320%', undefined, (t) => {
      const want = t >= starts[2] ? 'map' : 'graph'
      if (want !== auto) {
        auto = want
        setView(want)
      }
    })
  })
  mm.add(MOBILE, () => {
    const tl = gsap.timeline({ paused: true })
    const starts = build(tl)
    tl.call(() => setView('map'), undefined, starts[2])
    tl.timeScale(1.3)
    ScrollTrigger.create({ trigger: win, start: 'top 70%', once: true, onEnter: () => tl.play() })
  })
}
