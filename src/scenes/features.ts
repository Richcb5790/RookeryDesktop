import { gsap, ScrollTrigger } from '../lib/scroll'

// The submodule sync tile's diagram: both submodules merge first, then the parent's merge commit
// records pointers that resolve to those merge results.

const ROWS = [
  { name: 'app', y: 40, c: 'var(--lane-0)' },
  { name: 'ui-kit', y: 118, c: 'var(--lane-5)' },
  { name: 'engine', y: 186, c: 'var(--lane-3)' }
]

export function initFeatures(reduced: boolean): void {
  const svg = document.getElementById('sub-diagram') as unknown as SVGSVGElement
  if (!svg) return
  svg.setAttribute('viewBox', '0 0 340 210')
  let html = ''
  for (const r of ROWS) {
    const mergeX = r.name === 'app' ? 262 : 196
    html += `<text x="0" y="${r.y + 4}">${r.name}</text>`
    html += `<path class="sd-main" d="M64 ${r.y} H330" stroke="${r.c}" />`
    html += `<path class="sd-arc" d="M96 ${r.y} C110 ${r.y - 26} 128 ${r.y - 26} 150 ${r.y - 26} H${mergeX - 30} C${mergeX - 12} ${r.y - 26} ${mergeX - 4} ${r.y - 12} ${mergeX} ${r.y}" stroke="${r.c}" opacity=".85" />`
    html += `<circle class="sd-dot" cx="96" cy="${r.y}" r="5" fill="${r.c}" />`
    html += `<circle class="sd-dot" cx="150" cy="${r.y - 26}" r="4.5" fill="${r.c}" />`
    html += `<circle class="sd-merge" data-row="${r.name}" cx="${mergeX}" cy="${r.y}" r="7.5" fill="${r.c}" stroke="var(--bg)" stroke-width="2.5" />`
  }
  html += '<path class="sd-ptr" d="M262 40 C262 80 220 92 200 112" />'
  html += '<path class="sd-ptr" d="M262 40 C276 100 240 150 202 180" />'
  html += `<g class="sd-badge" data-n="1"><circle cx="196" cy="${118 - 20}" r="8" fill="var(--accent)"/><text x="196" y="${118 - 16.5}" text-anchor="middle">1</text></g>`
  html += `<g class="sd-badge" data-n="2"><circle cx="196" cy="${186 - 20}" r="8" fill="var(--accent)"/><text x="196" y="${186 - 16.5}" text-anchor="middle">2</text></g>`
  html += `<g class="sd-badge" data-n="3"><circle cx="262" cy="20" r="8" fill="var(--accent)"/><text x="262" y="23.5" text-anchor="middle">3</text></g>`
  svg.innerHTML = html

  if (reduced) return

  const arcs = [...svg.querySelectorAll<SVGPathElement>('.sd-arc')]
  const ptrs = [...svg.querySelectorAll<SVGPathElement>('.sd-ptr')]
  for (const p of [...arcs, ...ptrs]) {
    const len = Math.ceil(p.getTotalLength()) + 1
    p.style.strokeDasharray = p.classList.contains('sd-ptr') ? '3 5' : `${len} ${len}`
    p.dataset.len = String(len)
  }
  const merge = (name: string): Element => svg.querySelector(`.sd-merge[data-row="${name}"]`)!
  const badge = (n: number): Element => svg.querySelector(`.sd-badge[data-n="${n}"]`)!

  const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.2, paused: true })
  tl.set([merge('app'), merge('ui-kit'), merge('engine'), badge(1), badge(2), badge(3)], { scale: 0, transformOrigin: '50% 50%' })
    .set(ptrs, { opacity: 0 })
    .fromTo(arcs, { strokeDashoffset: (_i: number, p: SVGPathElement) => p.dataset.len! }, { strokeDashoffset: 0, duration: 1, stagger: 0.15, ease: 'power2.inOut' })
    .to(merge('ui-kit'), { scale: 1, duration: 0.4, ease: 'back.out(3)' }, '+=0.1')
    .to(badge(1), { scale: 1, duration: 0.35, ease: 'back.out(3)' }, '<')
    .to(merge('engine'), { scale: 1, duration: 0.4, ease: 'back.out(3)' }, '+=0.25')
    .to(badge(2), { scale: 1, duration: 0.35, ease: 'back.out(3)' }, '<')
    .to(merge('app'), { scale: 1, duration: 0.45, ease: 'back.out(3)' }, '+=0.35')
    .to(badge(3), { scale: 1, duration: 0.35, ease: 'back.out(3)' }, '<')
    .to(ptrs, { opacity: 1, duration: 0.5, stagger: 0.15 }, '+=0.1')
    .to(ptrs, { strokeDashoffset: -32, duration: 1.6, ease: 'none' }, '<')
    .to({}, { duration: 1.4 })
    .to(svg.querySelectorAll('.sd-arc, .sd-merge, .sd-badge, .sd-ptr'), { opacity: 0, duration: 0.4 })
    .set(svg.querySelectorAll('.sd-arc, .sd-merge, .sd-badge'), { opacity: 1 })

  ScrollTrigger.create({
    trigger: svg,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => (self.isActive ? tl.play() : tl.pause())
  })
}
