import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let lenis: Lenis | null = null

/** Smooth scrolling, driven by GSAP's ticker so ScrollTrigger scenes stay in step with it. */
export function initScroll(reduced: boolean): void {
  if (!reduced) {
    lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.95 })
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((t) => lenis?.raf(t * 1000))
    gsap.ticker.lagSmoothing(0)
  }

  // In-page links glide (or jump, with reduced motion) and keep the nav from covering the target.
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]')
    if (!a) return
    const id = a.getAttribute('href')!
    const target = id === '#top' ? document.body : document.querySelector<HTMLElement>(id)
    if (!target) return
    e.preventDefault()
    scrollToEl(target)
    history.replaceState(null, '', id)
    if (id !== '#top') target.focus({ preventScroll: true })
  })
}

export function scrollToEl(target: HTMLElement): void {
  const offset = -(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 68) + 1
  if (lenis) lenis.scrollTo(target, { offset, duration: 1.6 })
  else {
    const top = target === document.body ? 0 : target.getBoundingClientRect().top + scrollY + offset
    scrollTo({ top, behavior: 'auto' })
  }
}

export { gsap, ScrollTrigger }
