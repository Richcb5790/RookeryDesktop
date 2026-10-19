import { ScrollTrigger } from '../lib/scroll'

/** Glass nav once you leave the top, and a dot under the section you're in. */
export function initNav(): void {
  const nav = document.getElementById('nav')!
  const update = (): void => {
    nav.classList.toggle('scrolled', scrollY > 12)
  }
  update()
  addEventListener('scroll', update, { passive: true })

  const links = [...nav.querySelectorAll<HTMLAnchorElement>('.nav-links a')]
  for (const a of links) {
    const section = document.querySelector(a.getAttribute('href')!)
    if (!section) continue
    ScrollTrigger.create({
      trigger: section,
      start: 'top 45%',
      end: 'bottom 45%',
      onToggle: (self) => {
        a.classList.toggle('active', self.isActive)
        if (self.isActive) a.setAttribute('aria-current', 'true')
        else a.removeAttribute('aria-current')
      }
    })
  }
}
