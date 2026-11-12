import { finePointer } from './motion'
import { gsap, ScrollTrigger } from './scroll'

// Page-wide polish that isn't tied to one scene: the scroll progress line, the light that follows
// the pointer, buttons that lean toward it, headings that rise word by word, numbers that count up,
// the looping ticker, and a sky whose colour shifts from section to section.

/** A thin lane-coloured line under the nav that fills as the page is read. */
function progressLine(): void {
  const bar = document.getElementById('progress-bar')
  if (!bar) return
  gsap.to(bar, {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { trigger: document.documentElement, start: 'top top', end: 'bottom bottom', scrub: 0.3 }
  })
}

/** A soft pool of light under the pointer, so cards and windows seem lit from where you're looking. */
function cursorGlow(): void {
  const glow = document.getElementById('cursor-glow')
  if (!glow) return
  const x = gsap.quickTo(glow, 'x', { duration: 0.7, ease: 'power3.out' })
  const y = gsap.quickTo(glow, 'y', { duration: 0.7, ease: 'power3.out' })
  let shown = false
  addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return
      x(e.clientX)
      y(e.clientY)
      if (!shown) {
        shown = true
        glow.classList.add('on')
      }
    },
    { passive: true }
  )
  document.addEventListener('pointerleave', () => {
    shown = false
    glow.classList.remove('on')
  })
}

/** Primary buttons lean a few pixels toward the pointer, and settle back with a spring. */
function magnetic(): void {
  document.querySelectorAll<HTMLElement>('.btn-primary, .log-arrow').forEach((btn) => {
    // Through custom properties feeding the CSS `translate` property, so the lean adds to the
    // button's own hover transform instead of fighting its transition.
    const pull = 0.22
    btn.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return
      const r = btn.getBoundingClientRect()
      gsap.to(btn, {
        '--mag-x': `${((e.clientX - (r.left + r.width / 2)) * pull).toFixed(1)}px`,
        '--mag-y': `${((e.clientY - (r.top + r.height / 2)) * pull).toFixed(1)}px`,
        duration: 0.35,
        ease: 'power3.out'
      })
    })
    btn.addEventListener('pointerleave', () => gsap.to(btn, { '--mag-x': '0px', '--mag-y': '0px', duration: 0.7, ease: 'elastic.out(1, 0.45)' }))
  })
}

/**
 * Wraps each word of a heading so it can rise out of a mask. Only text nodes are touched, so
 * `<br>` and coloured spans keep working, and the words stay ordinary text for readers and crawlers.
 */
function splitWords(el: HTMLElement): HTMLElement[] {
  const words: HTMLElement[] = []
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  const texts: Text[] = []
  while (walker.nextNode()) texts.push(walker.currentNode as Text)
  for (const t of texts) {
    if (!t.data.trim()) continue
    const frag = document.createDocumentFragment()
    for (const part of t.data.split(/(\s+)/)) {
      if (!part) continue
      if (/^\s+$/.test(part)) {
        frag.append(' ')
        continue
      }
      const mask = document.createElement('span')
      mask.className = 'word'
      const inner = document.createElement('span')
      inner.textContent = part
      mask.append(inner)
      frag.append(mask)
      words.push(inner)
    }
    t.replaceWith(frag)
  }
  return words
}

function headings(): void {
  document.querySelectorAll<HTMLElement>('.h2').forEach((h) => {
    const words = splitWords(h)
    if (!words.length) return
    gsap.from(words, {
      yPercent: 115,
      rotate: 4,
      duration: 1.1,
      ease: 'power4.out',
      stagger: 0.06,
      scrollTrigger: { trigger: h, start: 'top 90%', once: true }
    })
  })
}

/** Numbers marked `data-count` run up to their value when they come into view. */
function counters(): void {
  document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    const to = Number(el.dataset.count)
    if (!to) return
    const v = { n: 0 }
    el.textContent = '0'
    gsap.to(v, {
      n: to,
      duration: 1.6,
      ease: 'power2.out',
      onUpdate: () => (el.textContent = String(Math.round(v.n))),
      scrollTrigger: { trigger: el, start: 'top 90%', once: true }
    })
  })
}

/** The ticker's items are repeated once so the CSS loop can wrap without a seam. */
function marquee(): void {
  const track = document.getElementById('marquee-track')
  if (!track) return
  track.innerHTML += track.innerHTML
}

/** Each section names a sky colour; the aurora behind the page cross-fades to it as you arrive. */
function sky(): void {
  const root = document.documentElement
  document.querySelectorAll<HTMLElement>('[data-sky]').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => {
        if (self.isActive) root.dataset.sky = section.dataset.sky
      }
    })
  })
}

/** Call after the pinned scenes exist, so triggers further down account for their pin spacing. */
export function initEffects(reduced: boolean): void {
  marquee()
  sky()
  if (reduced) return
  progressLine()
  headings()
  counters()
  if (finePointer) {
    cursorGlow()
    magnetic()
  }
}
