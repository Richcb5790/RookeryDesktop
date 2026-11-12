import { gsap } from '../lib/scroll'

// The "verify your download" terminal beside the trust cards: its commands appear one at a time,
// each answered by its result, and the seal stamps down when the last check passes.

export function initTrust(reduced: boolean): void {
  const body = document.getElementById('verify-body')
  if (!body || reduced) return
  const lines = [...body.querySelectorAll<HTMLElement>('.v-line')]
  const seal = body.parentElement!.querySelector<HTMLElement>('.verify-seal')!
  gsap.set(lines, { opacity: 0, x: -8 })
  gsap.set(seal, { scale: 2.2, opacity: 0, rotate: -24 })
  const tl = gsap.timeline({ scrollTrigger: { trigger: body, start: 'top 78%', once: true } })
  lines.forEach((l, i) => {
    tl.to(l, { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }, l.classList.contains('v-ok') ? '+=0.18' : i ? '+=0.45' : 0.2)
  })
  tl.to(seal, { scale: 1, opacity: 1, rotate: -8, duration: 0.45, ease: 'back.out(2.2)' }, '+=0.2')
}
