import { ScrollTrigger } from '../lib/scroll'

/**
 * Pins a scene's stage and scrubs `tl` through it. The step list beside the visual follows along:
 * the step whose start time the timeline has passed is active, earlier ones are done, and the rail
 * fills with overall progress. While the timeline is mid-flight, `busy` keeps hover effects off.
 */
export function pinnedSteps(
  section: HTMLElement,
  tl: gsap.core.Timeline,
  starts: number[],
  end: string,
  busy?: HTMLElement,
  onTime?: (t: number) => void
): ScrollTrigger {
  const steps = [...section.querySelectorAll<HTMLElement>('.steps .step')]
  const list = section.querySelector<HTMLElement>('.steps')!
  let current = -1
  const setStep = (i: number): void => {
    if (i === current) return
    current = i
    steps.forEach((s, k) => {
      s.classList.toggle('is-active', k === i)
      s.classList.toggle('is-done', k < i)
    })
  }
  return ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end,
    pin: section.querySelector<HTMLElement>('.pin-stage')!,
    scrub: 0.8,
    animation: tl,
    onUpdate: (self) => {
      const t = tl.duration() * self.progress
      let i = 0
      starts.forEach((s, k) => {
        if (t >= s - 0.01) i = k
      })
      setStep(i)
      onTime?.(t)
      list.style.setProperty('--p', self.progress.toFixed(3))
      if (busy) {
        if (self.progress > 0.02 && self.progress < 0.98) busy.dataset.busy = '1'
        else delete busy.dataset.busy
      }
    }
  })
}
