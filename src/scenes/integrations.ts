import { icon } from '../lib/icons'
import { DESKTOP } from '../lib/motion'
import { onPointer } from '../lib/parallax'
import { gsap, ScrollTrigger } from '../lib/scroll'

// The integrations orbit: Rookery at the center, the hosts circling on three tilted rings. Positions
// are projected by hand each frame, so moons pass behind the core and shrink on the far side.

interface Moon {
  key: string
  name: string
  icon: string
  brand: string
  ring: number
  phase: number
}

const MOONS: Moon[] = [
  { key: 'github', name: 'GitHub', icon: 'github', brand: '#F2EEE3', ring: 0, phase: 0.2 },
  { key: 'gitlab', name: 'GitLab', icon: 'gitlab', brand: '#FC6D26', ring: 0, phase: Math.PI + 0.2 },
  { key: 'bitbucket', name: 'Bitbucket', icon: 'bitbucket', brand: '#2684FF', ring: 1, phase: 1.5 },
  { key: 'azure', name: 'Azure DevOps', icon: 'pipeline', brand: '#4CB4F0', ring: 1, phase: Math.PI + 1.5 },
  { key: 'jira', name: 'Jira', icon: 'jira', brand: '#579DFF', ring: 2, phase: 2.6 },
  { key: 'trello', name: 'Trello', icon: 'trello', brand: '#5AACFF', ring: 2, phase: Math.PI + 2.6 }
]

// Radius (share of the stage's half-width) and angular speed (radians per second) of each ring.
const RINGS = [
  { r: 0.52, speed: 0.16 },
  { r: 0.72, speed: -0.11 },
  { r: 0.92, speed: 0.075 }
]

export function initIntegrations(reduced: boolean): void {
  const section = document.getElementById('integrations')!
  const sys = document.getElementById('orbit-system')!
  const cards = [...section.querySelectorAll<HTMLElement>('.int-card')]

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.classList.add('orbit-rings')
  svg.innerHTML =
    RINGS.map((_, i) => `<ellipse class="${i === 1 ? 'dashed' : ''}" />`).join('') + MOONS.map((m) => `<line data-key="${m.key}" />`).join('')
  sys.prepend(svg)
  const ellipses = [...svg.querySelectorAll('ellipse')]
  const beams = new Map([...svg.querySelectorAll<SVGLineElement>('line')].map((l) => [l.dataset.key!, l]))

  const moonEls = MOONS.map((m) => {
    const el = document.createElement('div')
    el.className = 'moon'
    el.dataset.key = m.key
    el.style.setProperty('--brand', m.brand)
    el.innerHTML = `<div class="moon-disc">${icon(m.icon, 32)}</div><span class="moon-name">${m.name}</span>`
    sys.appendChild(el)
    return el
  })

  // The plane's tilt follows the pointer a little; scroll turns the system on top of its own drift.
  let tiltX = 0
  let tiltY = 0
  let scrollTurn = 0
  if (!reduced) {
    onPointer((x, y) => {
      tiltX = x
      tiltY = y
    })
    ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        scrollTurn = self.progress * Math.PI * 1.4
      }
    })
  }

  let lit: Set<string> | null = null

  const frame = (time: number): void => {
    const half = sys.clientWidth / 2
    const cy = sys.clientHeight / 2
    const squash = 0.4 + tiltY * 0.08
    const tilt = (-14 + tiltX * 7) * (Math.PI / 180)
    const cosT = Math.cos(tilt)
    const sinT = Math.sin(tilt)

    RINGS.forEach((ring, i) => {
      const e = ellipses[i]
      e.setAttribute('cx', String(half))
      e.setAttribute('cy', String(cy))
      e.setAttribute('rx', String(ring.r * half))
      e.setAttribute('ry', String(ring.r * half * squash))
      e.setAttribute('transform', `rotate(${(tilt * 180) / Math.PI} ${half} ${cy})`)
    })

    MOONS.forEach((m, i) => {
      const ring = RINGS[m.ring]
      const a = m.phase + time * ring.speed + scrollTurn * (m.ring === 1 ? -1 : 1)
      const ex = Math.cos(a) * ring.r * half
      const ey = Math.sin(a) * ring.r * half * squash
      const x = half + ex * cosT - ey * sinT
      const y = cy + ex * sinT + ey * cosT
      const depth = Math.sin(a) // 1 = nearest the viewer, -1 = behind the core
      const scale = 0.72 + 0.28 * ((depth + 1) / 2)
      const el = moonEls[i]
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`
      el.style.zIndex = depth > -0.05 ? '10' : '1'
      el.style.opacity = String(0.55 + 0.45 * ((depth + 1) / 2))
      const beam = beams.get(m.key)!
      beam.setAttribute('x1', String(half))
      beam.setAttribute('y1', String(cy))
      beam.setAttribute('x2', x.toFixed(1))
      beam.setAttribute('y2', y.toFixed(1))
    })
  }

  frame(0)
  if (!reduced) gsap.ticker.add((t) => frame(t))
  else addEventListener('resize', () => frame(0))

  const highlight = (hosts: string[] | null): void => {
    lit = hosts ? new Set(hosts) : null
    moonEls.forEach((el) => {
      const on = lit?.has(el.dataset.key!) ?? false
      el.classList.toggle('lit', on)
      el.classList.toggle('dim', lit !== null && !on)
      beams.get(el.dataset.key!)!.classList.toggle('on', on)
    })
  }

  let scrollActive: HTMLElement | null = null
  let hovered: HTMLElement | null = null
  const apply = (): void => {
    const card = hovered ?? scrollActive
    cards.forEach((c) => c.classList.toggle('active', c === card))
    highlight(card ? card.dataset.hosts!.split(' ') : null)
  }
  for (const card of cards) {
    card.tabIndex = 0
    card.addEventListener('pointerenter', () => {
      hovered = card
      apply()
    })
    card.addEventListener('pointerleave', () => {
      hovered = null
      apply()
    })
    card.addEventListener('focus', () => {
      hovered = card
      apply()
    })
    card.addEventListener('blur', () => {
      hovered = null
      apply()
    })
  }

  // On wide screens the orbit stays put while the cards scroll past; the card crossing the middle
  // of the screen lights up the hosts it works with.
  gsap.matchMedia().add(DESKTOP, () => {
    const triggers = cards.map((card) =>
      ScrollTrigger.create({
        trigger: card,
        start: 'top 58%',
        end: 'bottom 42%',
        onToggle: (self) => {
          if (self.isActive) scrollActive = card
          else if (scrollActive === card) scrollActive = null
          apply()
        }
      })
    )
    return () => triggers.forEach((t) => t.kill())
  })
}
