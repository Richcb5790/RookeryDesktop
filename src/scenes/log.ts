import { DESKTOP } from '../lib/motion'
import { gsap, ScrollTrigger, scrollToY } from '../lib/scroll'

// The flight log: release highlights strung along a lane like commits, newest first. On a desktop
// with motion on, the section pins and scrolling the page carries the lane sideways. Everywhere
// else it's an ordinary sideways scroller with snap points, driven by the arrow buttons, a swipe,
// or the keyboard.

export function initLog(reduced: boolean): void {
  const section = document.getElementById('whats-new')
  if (!section) return
  const viewport = document.getElementById('log-viewport')!
  const track = document.getElementById('log-track')!
  const prev = document.getElementById('log-prev') as HTMLButtonElement
  const next = document.getElementById('log-next') as HTMLButtonElement
  const items = [...track.querySelectorAll<HTMLElement>('.log-item')]

  /** The pinned scene, while there is one. The arrows then move the page instead of the scroller. */
  let pinned: ScrollTrigger | null = null

  const step = (): number => (items[1]?.offsetLeft ?? 320) - (items[0]?.offsetLeft ?? 0)

  const move = (dir: 1 | -1): void => {
    if (pinned) {
      const span = pinned.end - pinned.start
      const per = span / Math.max(1, (track.scrollWidth - viewport.clientWidth) / step())
      scrollToY(Math.min(pinned.end, Math.max(pinned.start, scrollY + dir * per)))
    } else {
      viewport.scrollBy({ left: dir * step(), behavior: reduced ? 'auto' : 'smooth' })
    }
  }
  prev.addEventListener('click', () => move(-1))
  next.addEventListener('click', () => move(1))

  const setEnds = (p: number): void => {
    prev.disabled = p <= 0.005
    next.disabled = p >= 0.995
    track.style.setProperty('--p', p.toFixed(4))
  }
  const fromScroller = (): void => {
    const max = viewport.scrollWidth - viewport.clientWidth
    setEnds(max > 0 ? viewport.scrollLeft / max : 0)
  }
  viewport.addEventListener('scroll', () => !pinned && fromScroller(), { passive: true })
  fromScroller()

  if (reduced) return

  const mm = gsap.matchMedia()
  mm.add(DESKTOP, () => {
    section.classList.add('is-pinned')
    viewport.scrollLeft = 0
    const distance = (): number => Math.max(0, track.scrollWidth - viewport.clientWidth)
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: section.querySelector<HTMLElement>('.log-pin')!,
        scrub: 0.7,
        invalidateOnRefresh: true,
        onUpdate: (self) => setEnds(self.progress)
      }
    })
    pinned = tween.scrollTrigger!

    // Each card lifts into place as the lane carries it in from the right.
    items.forEach((item) => {
      gsap.from(item.querySelector('.log-card'), {
        opacity: 0.25,
        y: 36,
        scale: 0.96,
        ease: 'power2.out',
        scrollTrigger: { trigger: item, containerAnimation: tween, start: 'left 96%', end: 'left 62%', scrub: true }
      })
      ScrollTrigger.create({
        trigger: item,
        containerAnimation: tween,
        start: 'left 70%',
        onEnter: () => item.classList.add('lit'),
        onLeaveBack: () => item.classList.remove('lit')
      })
    })

    return () => {
      pinned = null
      section.classList.remove('is-pinned')
      gsap.set(track, { clearProps: 'transform' })
      fromScroller()
    }
  })
}
