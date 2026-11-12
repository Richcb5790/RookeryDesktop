import { gsap } from './scroll'
import { pointer } from './parallax'

// The sky behind the whole page: three layers of stars at different distances. Far stars barely
// move as you scroll; near ones drift faster and follow the pointer more, which gives the depth.
// Scroll quickly and the stars stretch into streaks, as if the page had jumped to warp; the
// brightest carry a four-point flare.

interface Star {
  x: number
  y: number
  r: number
  layer: number
  phase: number
  speed: number
  color: string
}

interface Meteor {
  x: number
  y: number
  vx: number
  vy: number
  life: number
}

const LAYERS = [
  { density: 0.00011, r: [0.35, 0.9], scroll: 0.03, depth: 5, alpha: 0.55 },
  { density: 0.00005, r: [0.7, 1.3], scroll: 0.09, depth: 12, alpha: 0.75 },
  { density: 0.000016, r: [1.1, 1.9], scroll: 0.2, depth: 24, alpha: 0.95 }
]

// Mostly warm white, with the odd star in the graph's lane colors.
const TINTS = ['242,238,227', '217,223,234', '217,223,234', '242,238,227', '76,201,240', '255,201,60', '169,160,214', '156,140,255']

/** How far a star's streak may reach, in pixels, however hard the page is thrown. */
const MAX_STREAK = 90

export function startStarfield(canvas: HTMLCanvasElement, reduced: boolean): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  let w = 0
  let h = 0
  let stars: Star[] = []
  let meteors: Meteor[] = []
  let nextMeteor = 3
  let lastScroll = scrollY
  /** Scroll speed in pixels per frame, eased so streaks grow and fade rather than flicker. */
  let warp = 0

  const rand = (a: number, b: number): number => a + Math.random() * (b - a)

  function build(): void {
    const dpr = Math.min(devicePixelRatio || 1, 2)
    w = innerWidth
    h = innerHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    stars = []
    LAYERS.forEach((L, layer) => {
      const n = Math.round(w * h * L.density) + 12
      for (let i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: rand(L.r[0], L.r[1]),
          layer,
          phase: Math.random() * Math.PI * 2,
          speed: rand(0.6, 1.8),
          color: TINTS[Math.random() < 0.82 ? Math.floor(Math.random() * 4) : 4 + Math.floor(Math.random() * 4)]
        })
      }
    })
  }

  function draw(t: number): void {
    ctx!.clearRect(0, 0, w, h)
    const sy = scrollY
    ctx!.lineCap = 'round'
    for (const s of stars) {
      const L = LAYERS[s.layer]
      const y = (((s.y - sy * L.scroll) % h) + h) % h
      const x = (((s.x - pointer.x * L.depth) % w) + w) % w
      const yy = y - pointer.y * L.depth * 0.7
      const tw = reduced ? 1 : 0.65 + 0.35 * Math.sin(t * s.speed + s.phase)
      const a = L.alpha * tw
      // Near layers streak further, exactly as they scroll further.
      const streak = Math.max(-MAX_STREAK, Math.min(MAX_STREAK, warp * L.scroll * 9))
      if (Math.abs(streak) > 2) {
        ctx!.strokeStyle = `rgba(${s.color},${a * 0.85})`
        ctx!.lineWidth = s.r * 1.5
        ctx!.beginPath()
        ctx!.moveTo(x, yy)
        ctx!.lineTo(x, yy + streak)
        ctx!.stroke()
        continue
      }
      ctx!.beginPath()
      ctx!.arc(x, yy, s.r, 0, Math.PI * 2)
      ctx!.fillStyle = `rgba(${s.color},${a})`
      ctx!.fill()
      if (s.r > 1.35) {
        ctx!.beginPath()
        ctx!.arc(x, yy, s.r * 3.2, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(${s.color},${a * 0.08})`
        ctx!.fill()
      }
      if (s.r > 1.6) {
        // A four-point flare, breathing with the star's twinkle.
        const len = s.r * (4 + 3 * tw)
        ctx!.strokeStyle = `rgba(${s.color},${a * 0.35})`
        ctx!.lineWidth = 0.7
        ctx!.beginPath()
        ctx!.moveTo(x - len, yy)
        ctx!.lineTo(x + len, yy)
        ctx!.moveTo(x, yy - len)
        ctx!.lineTo(x, yy + len)
        ctx!.stroke()
      }
    }
    for (const m of meteors) {
      const tail = 28
      const g = ctx!.createLinearGradient(m.x, m.y, m.x - m.vx * tail, m.y - m.vy * tail)
      g.addColorStop(0, `rgba(255,236,190,${0.9 * m.life})`)
      g.addColorStop(1, 'rgba(255,236,190,0)')
      ctx!.strokeStyle = g
      ctx!.lineWidth = 1.5
      ctx!.beginPath()
      ctx!.moveTo(m.x, m.y)
      ctx!.lineTo(m.x - m.vx * tail, m.y - m.vy * tail)
      ctx!.stroke()
      ctx!.beginPath()
      ctx!.arc(m.x, m.y, 1.6, 0, Math.PI * 2)
      ctx!.fillStyle = `rgba(255,244,214,${m.life})`
      ctx!.fill()
    }
  }

  build()
  let resizeTimer = 0
  addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(() => {
      build()
      if (reduced) draw(0)
    }, 120)
  })

  if (reduced) {
    draw(0)
    return
  }

  gsap.ticker.add((time, dt) => {
    if (document.hidden) return
    const now = scrollY
    // Normalised to a 60fps frame, so the streaks are the same length on any display.
    const v = ((now - lastScroll) / Math.max(dt, 1)) * 16.7
    lastScroll = now
    warp += (v - warp) * 0.18
    if (Math.abs(warp) < 0.05) warp = 0

    nextMeteor -= dt / 1000
    if (nextMeteor <= 0 && meteors.length < 2) {
      const dir = Math.random() < 0.5 ? -1 : 1
      meteors.push({ x: rand(w * 0.15, w * 0.85), y: rand(0, h * 0.4), vx: dir * rand(6, 10), vy: rand(2.4, 4.2), life: 1 })
      nextMeteor = rand(4, 9)
    }
    for (const m of meteors) {
      m.x += m.vx
      m.y += m.vy
      m.life -= 0.016
    }
    meteors = meteors.filter((m) => m.life > 0)
    draw(time)
  })
}
