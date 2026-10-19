// One place that decides how much the page moves. `?motion=reduce` forces the calm version for testing.

const params = new URLSearchParams(location.search)

export const reducedMotion: boolean =
  params.get('motion') === 'reduce' || matchMedia('(prefers-reduced-motion: reduce)').matches

/** Phones and small tablets get stacked layouts, no pinning and no pointer parallax. */
export const MOBILE = '(max-width: 767px)'
export const DESKTOP = '(min-width: 768px)'

export const finePointer: boolean = matchMedia('(hover: hover) and (pointer: fine)').matches

export const isMobile = (): boolean => matchMedia(MOBILE).matches

export function markMotion(): void {
  document.documentElement.dataset.motion = reducedMotion ? 'reduce' : 'full'
  document.documentElement.classList.add('js')
}

export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/** Runs `init` once the element comes within a screen of the viewport. */
export function whenNear(el: Element, init: () => void): void {
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect()
        init()
      }
    },
    { rootMargin: '100% 0px' }
  )
  io.observe(el)
}
