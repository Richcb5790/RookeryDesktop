import { gsap, ScrollTrigger } from '../lib/scroll'

// The Harbor from the app's repository page, at the foot of the site: a lighthouse sweeping its beam
// over the water and two rockets moored at the pier. Its layers drift apart as you reach the bottom,
// and one rocket lifts off.

const STARS: [number, number, number, boolean][] = [
  [-1340, 40, 1.2, false], [-1180, 96, 1, true], [-1010, 26, 1.4, false], [-860, 70, 1, false], [-700, 34, 1.3, true],
  [-560, 108, 1, false], [-420, 52, 1.5, false], [-260, 20, 1, true], [-120, 84, 1.2, false], [60, 30, 1.4, false],
  [140, 64, 1, true], [220, 22, 1.6, false], [300, 92, 1, false], [380, 40, 1.2, true], [470, 18, 1, false],
  [520, 76, 1.5, false], [610, 34, 1.1, true], [690, 104, 1, false], [760, 24, 1.4, false], [870, 44, 1, true],
  [920, 98, 1.2, false], [1100, 28, 1.3, false], [1150, 88, 1, true], [1180, 52, 1.5, false], [1320, 66, 1.2, true],
  [1480, 30, 1.4, false], [1640, 90, 1, true], [1800, 46, 1.3, false], [1960, 20, 1, false], [2120, 74, 1.2, true]
]

const WATER: [number, number, number][] = [
  [40, 360, 166], [420, 700, 178], [120, 520, 192], [600, 1180, 204], [880, 1160, 172], [-560, -60, 172],
  [-1300, -700, 186], [-900, -240, 200], [-1500, -1100, 164], [1260, 1700, 180], [1500, 2100, 196], [1800, 2300, 168]
]

const rocket = (x: number, id: string): string => `
  <g class="hs-rocket" id="${id}" transform="translate(${x} 96)">
    <path class="hs-flame" d="M-6 44 Q0 70 6 44 Z" />
    <path class="hs-rocket-fin" d="M-9 34 L-15 46 L-6 44 Z M9 34 L15 46 L6 44 Z" />
    <path class="hs-rocket-body" d="M0 0 C 9 9 10 24 8 44 L -8 44 C -10 24 -9 9 0 0 Z" />
    <path class="hs-rocket-nose" d="M0 0 C 4 4 6 8 7 12 L -7 12 C -6 8 -4 4 0 0 Z" />
    <circle class="hs-rocket-window" cx="0" cy="22" r="3.6" />
  </g>`

export function initFooter(reduced: boolean): void {
  const svg = document.getElementById('harbor-svg') as unknown as SVGSVGElement
  svg.innerHTML = `
    <defs>
      <linearGradient id="hs-beam" x1="1" y1="0" x2="0" y2="0">
        <stop offset="0" style="stop-color: var(--accent); stop-opacity: 0.42" />
        <stop offset="1" style="stop-color: var(--accent); stop-opacity: 0" />
      </linearGradient>
      <linearGradient id="hs-water" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style="stop-color: #0a1028; stop-opacity: 0.55" />
        <stop offset="1" style="stop-color: #0a1028" />
      </linearGradient>
      <radialGradient id="hs-glow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" style="stop-color: var(--accent); stop-opacity: 0.55" />
        <stop offset="1" style="stop-color: var(--accent); stop-opacity: 0" />
      </radialGradient>
    </defs>
    <g class="hs-sky">${STARS.map(([x, y, r, t], i) => `<circle class="hs-star ${t ? 'hs-twinkle' : ''}" cx="${x}" cy="${y}" r="${r}" style="animation-delay:${(i % 5) * 0.8}s" />`).join('')}</g>
    <g class="hs-planet"><circle cx="1030" cy="54" r="20" /><ellipse cx="1030" cy="54" rx="34" ry="8" transform="rotate(-16 1030 54)" /></g>
    <polygon class="hs-beam" points="820,70 420,10 420,130" fill="url(#hs-beam)" />
    <rect x="-3000" y="150" width="6000" height="120" fill="url(#hs-water)" />
    <g class="hs-water">${WATER.map(([a, b, y]) => `<line x1="${a}" y1="${y}" x2="${b}" y2="${y}" />`).join('')}</g>
    <g class="hs-reflection"><line x1="220" y1="170" x2="226" y2="170" /><line x1="470" y1="186" x2="478" y2="186" /><line x1="760" y1="196" x2="768" y2="196" /><line x1="1100" y1="184" x2="1108" y2="184" /><line x1="-420" y1="180" x2="-413" y2="180" /></g>
    <g class="hs-lamp-reflection"><line x1="812" y1="162" x2="828" y2="162" /><line x1="808" y1="174" x2="832" y2="174" /><line x1="814" y1="188" x2="826" y2="188" /></g>
    <g class="hs-dock">
      <g class="hs-pier">${[790, 850, 910, 970, 1030, 1090, 1150].map((x) => `<rect x="${x}" y="146" width="6" height="30" rx="1" />`).join('')}</g>
      <rect class="hs-deck" x="770" y="140" width="460" height="8" rx="2" />
      <g class="hs-bollards"><rect x="984" y="133" width="8" height="8" rx="2" /><rect x="1104" y="133" width="8" height="8" rx="2" /></g>
      <path class="hs-rope" d="M948 118 Q 968 140 988 134" />
      <path class="hs-rope" id="hs-rope-2" d="M1068 118 Q 1088 140 1108 134" />
      <g class="hs-lighthouse">
        <polygon class="hs-tower" points="806,140 834,140 827,80 813,80" />
        <polygon class="hs-band" points="809,122 831,122 829,108 811,108" />
        <rect class="hs-gallery" x="808" y="76" width="24" height="5" rx="1" />
        <circle class="hs-glow" cx="820" cy="70" r="22" fill="url(#hs-glow)" />
        <rect class="hs-lantern" x="812" y="63" width="16" height="13" rx="2" />
        <path class="hs-roof" d="M808 63 L 820 52 L 832 63 Z" />
      </g>
      ${rocket(940, 'hs-rocket-1')}
      ${rocket(1060, 'hs-rocket-2')}
    </g>`

  if (reduced) return

  const footer = document.querySelector<HTMLElement>('.footer')!
  // Far layers drift less than near ones as the footer scrolls in.
  gsap
    .timeline({ scrollTrigger: { trigger: footer, start: 'top bottom', end: 'bottom bottom', scrub: true } })
    .fromTo(svg.querySelector('.hs-sky'), { y: -40 }, { y: 0, ease: 'none' }, 0)
    .fromTo(svg.querySelector('.hs-planet'), { y: -70, x: 40 }, { y: 0, x: 0, ease: 'none' }, 0)
    .fromTo(svg.querySelector('.hs-dock'), { y: 50 }, { y: 0, ease: 'none' }, 0)

  // At the very bottom, the second rocket slips its rope and launches.
  const r2 = svg.querySelector('#hs-rocket-2')!
  const flame = r2.querySelector('.hs-flame')!
  const launch = gsap
    .timeline({ paused: true })
    .to('#hs-rope-2', { opacity: 0, duration: 0.3 })
    .to(flame, { opacity: 1, scaleY: 1.4, duration: 0.15, yoyo: true, repeat: 7 }, 0.1)
    .to(r2, { y: '-=6', duration: 0.5, ease: 'power1.inOut', yoyo: true, repeat: 1 }, 0.1)
    .to(r2, { y: '-=420', x: '+=60', duration: 2.2, ease: 'power2.in' }, 1.1)
    .to(flame, { opacity: 1, scaleY: 2.2, duration: 0.2 }, 1)
  ScrollTrigger.create({ trigger: footer, start: 'bottom bottom-=2', once: true, onEnter: () => launch.play() })
}
