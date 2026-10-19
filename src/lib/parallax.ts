import { gsap } from './scroll'

/** The pointer's position over the window, -1..1 on each axis, eased so layers drift rather than snap. */
export const pointer = { x: 0, y: 0, tx: 0, ty: 0 }

type Listener = (x: number, y: number) => void
const listeners = new Set<Listener>()

let started = false

/** Starts tracking the pointer. Layers subscribe through `onPointer`. */
export function startPointer(): void {
  if (started) return
  started = true
  addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return
      pointer.tx = (e.clientX / innerWidth) * 2 - 1
      pointer.ty = (e.clientY / innerHeight) * 2 - 1
    },
    { passive: true }
  )
  document.addEventListener('pointerleave', () => {
    pointer.tx = 0
    pointer.ty = 0
  })
  gsap.ticker.add(() => {
    pointer.x += (pointer.tx - pointer.x) * 0.06
    pointer.y += (pointer.ty - pointer.y) * 0.06
    for (const l of listeners) l(pointer.x, pointer.y)
  })
}

export function onPointer(l: Listener): () => void {
  listeners.add(l)
  return () => listeners.delete(l)
}

/**
 * Pointer parallax: every [data-depth] element inside `root` shifts with the pointer, more for higher
 * depths. It uses the CSS `translate` property so GSAP's scroll transforms on the same element still apply.
 */
export function pointerParallax(root: ParentNode, strength = 22): void {
  const els = [...root.querySelectorAll<HTMLElement | SVGElement>('[data-depth]')].map((el) => ({
    el,
    d: Number(el.dataset.depth)
  }))
  if (!els.length) return
  onPointer((x, y) => {
    for (const { el, d } of els) el.style.translate = `${(x * d * strength).toFixed(2)}px ${(y * d * strength * 0.7).toFixed(2)}px`
  })
}

/**
 * Scroll parallax: [data-speed] elements drift against the scroll while their section passes.
 * Positive speeds lag behind (far away), negative ones rush ahead (close to the camera).
 */
export function scrollParallax(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-speed]').forEach((el) => {
    const s = Number(el.dataset.speed)
    const trigger = el.closest('[data-parallax]') ?? el
    gsap.fromTo(
      el,
      { y: () => -s * innerHeight * 0.35 },
      {
        y: () => s * innerHeight * 0.35,
        ease: 'none',
        scrollTrigger: { trigger, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true }
      }
    )
  })
}

/** 3D tilt that follows the pointer across a card, with a highlight that tracks it. */
export function tilt(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-tilt]').forEach((card) => {
    const max = Number(card.dataset.tilt || 8)
    card.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return
      const r = card.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width
      const py = (e.clientY - r.top) / r.height
      card.style.setProperty('--rx', `${((0.5 - py) * max).toFixed(2)}deg`)
      card.style.setProperty('--ry', `${((px - 0.5) * max).toFixed(2)}deg`)
      card.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`)
      card.style.setProperty('--my', `${(py * 100).toFixed(1)}%`)
      card.classList.add('tilting')
    })
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--rx', '0deg')
      card.style.setProperty('--ry', '0deg')
      card.classList.remove('tilting')
    })
  })
}

/** Fades [data-reveal] blocks up as they enter. `data-reveal="2"` staggers by that many steps. */
export function reveals(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    const step = Number(el.dataset.reveal || 0)
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1,
      delay: step * 0.08,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    })
  })
}
