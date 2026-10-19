import { gsap } from './scroll'
import { pointer } from './parallax'

// The sky behind the whole page: three layers of stars at different distances. Far stars barely
// move as you scroll; near ones drift faster and follow the pointer more, which gives the depth.

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

export function startStarfield(canvas: HTMLCanvasElement, reduced: boolean): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  let w = 0
  let h = 0
  let stars: Star[] = []
  let meteor: Meteor | null = null
  let nextMeteor = 4

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
    for (const s of stars) {
      const L = LAYERS[s.layer]
      const y = (((s.y - sy * L.scroll) % h) + h) % h
      const x = (((s.x - pointer.x * L.depth) % w) + w) % w
      const yy = y - pointer.y * L.depth * 0.7
      const tw = reduced ? 1 : 0.65 + 0.35 * Math.sin(t * s.speed + s.phase)
      const a = L.alpha * tw
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
    }
    if (meteor) {
      const m = meteor
      const tail = 90
      const g = ctx!.createLinearGradient(m.x, m.y, m.x - m.vx * tail, m.y - m.vy * tail)
      g.addColorStop(0, `rgba(255,236,190,${0.9 * m.life})`)
      g.addColorStop(1, 'rgba(255,236,190,0)')
      ctx!.strokeStyle = g
      ctx!.lineWidth = 1.4
      ctx!.beginPath()
      ctx!.moveTo(m.x, m.y)
      ctx!.lineTo(m.x - m.vx * tail, m.y - m.vy * tail)
      ctx!.stroke()
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
    nextMeteor -= dt / 1000
    if (!meteor && nextMeteor <= 0) {
      const dir = Math.random() < 0.5 ? -1 : 1
      meteor = { x: rand(w * 0.2, w * 0.8), y: rand(0, h * 0.35), vx: dir * rand(5, 8), vy: rand(2.2, 3.6), life: 1 }
      nextMeteor = rand(7, 14)
    }
    if (meteor) {
      meteor.x += meteor.vx
      meteor.y += meteor.vy
      meteor.life -= 0.018
      if (meteor.life <= 0) meteor = null
    }
    draw(time)
  })
}
