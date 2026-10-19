import mascotSvg from '../assets/brand/space-mascot.svg?raw'
import { primeEdges, renderGraph } from '../lib/graph'
import { gsap } from '../lib/scroll'
import { TOUR } from './graphData'

// The hero: the Professor floating in front of a commit graph drawn as a constellation. The
// constellation is the same history the graph scene draws next, tilted back into the sky.

export function initHero(reduced: boolean): void {
  const hero = document.querySelector<HTMLElement>('.hero')!
  document.getElementById('hero-mascot')!.innerHTML = mascotSvg

  const svg = document.getElementById('constellation') as unknown as SVGSVGElement
  svg.setAttribute('viewBox', '0 0 1300 760')
  renderGraph(svg, TOUR, { rowH: 54, laneW: 86, x0: 520, y0: 80 }, { stars: true, nodeR: 4.2 })

  if (reduced) return

  const edges = primeEdges(svg)
  const stars = svg.querySelectorAll('.g-node')
  gsap.set(svg, { rotationX: 62, rotationZ: -28, y: -40, transformPerspective: 1100 })

  const intro = gsap.timeline({ defaults: { ease: 'power4.out' } })
  intro
    .from('.hero-title .line > span', { yPercent: 110, duration: 1.2, stagger: 0.12 })
    .from('.hero-eyebrow, .hero-sub, .hero-cta, .hero-meta', { opacity: 0, y: 24, duration: 1, stagger: 0.08 }, 0.35)
    .from('.hero-mascot', { opacity: 0, y: 220, x: 80, rotation: 14, duration: 1.8, ease: 'expo.out' }, 0.15)
    .from(stars, { scale: 0, transformOrigin: '50% 50%', duration: 0.6, stagger: { each: 0.05, from: 'end' }, ease: 'back.out(3)' }, 0.4)
    .to(edges, { strokeDashoffset: 0, duration: 1.4, stagger: { each: 0.05, from: 'end' }, ease: 'power2.inOut' }, 0.5)
    .from('.planet', { opacity: 0, scale: 0.6, duration: 2, ease: 'expo.out' }, 0.2)

  // Scrolling away: the copy lifts, the Professor rockets off faster than everything else, and the
  // constellation swings flat toward you as the graph scene takes over.
  const out = gsap.timeline({
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 }
  })
  out
    .to('.hero-copy', { y: -140, opacity: 0, ease: 'none' }, 0)
    .to('.hero-mascot', { y: -420, x: 120, rotation: 12, scale: 1.08, ease: 'power1.in' }, 0)
    .to(svg, { rotationX: 18, rotationZ: -8, scale: 1.5, opacity: 0, ease: 'none' }, 0)
    .to('.scroll-cue', { opacity: 0, duration: 0.15 }, 0)
}
