// A small commit-graph renderer in the style of the app's GraphRow.tsx: each commit sits in a lane,
// an edge leaves its child, runs down a lane and curves into its parent. A first parent's edge runs
// down the child's lane; a merge's other parents are reached down the merged line's lane.

export interface Ref {
  name: string
  head?: boolean
  /** Lane color index; defaults to the commit's */
  color?: number
}

export interface Commit {
  id: string
  lane: number
  /** Lane color index (0..7), kept separate from the lane so a branch can keep its color when it moves */
  color: number
  parents: string[]
  msg: string
  author: string
  refs?: Ref[]
}

export interface Metrics {
  rowH: number
  laneW: number
  /** x of lane 0's center */
  x0: number
  /** y of row 0's center */
  y0: number
}

export interface Edge {
  from: string
  to: string
  d: string
  color: number
  merge: boolean
}

export const SVG_NS = 'http://www.w3.org/2000/svg'

export const laneX = (lane: number, m: Metrics): number => m.x0 + lane * m.laneW
export const rowY = (row: number, m: Metrics): number => m.y0 + row * m.rowH

export function edgePath(row: number, start: number, run: number, end: number, parentRow: number, m: Metrics): string {
  const x1 = laneX(start, m)
  const xr = laneX(run, m)
  const xe = laneX(end, m)
  const y1 = rowY(row, m)
  const y2 = rowY(parentRow, m)
  const half = m.rowH / 2
  let d = `M${x1} ${y1}`
  d += start === run ? `L${xr} ${y1 + half}` : `C${x1} ${y1 + half / 2} ${xr} ${y1 + half / 2} ${xr} ${y1 + half}`
  if (y2 - half > y1 + half) d += `L${xr} ${y2 - half}`
  d += run === end ? `L${xe} ${y2}` : `C${xr} ${y2 - half / 2} ${xe} ${y2 - half / 2} ${xe} ${y2}`
  return d
}

export function layoutEdges(commits: Commit[], m: Metrics): Edge[] {
  const rowOf = new Map(commits.map((c, i) => [c.id, i]))
  const edges: Edge[] = []
  commits.forEach((c, i) => {
    c.parents.forEach((pid, k) => {
      const j = rowOf.get(pid)
      if (j === undefined) return
      const p = commits[j]
      const run = k === 0 ? c.lane : p.lane
      edges.push({ from: c.id, to: pid, d: edgePath(i, c.lane, run, p.lane, j, m), color: k === 0 ? c.color : p.color, merge: k > 0 })
    })
  })
  return edges
}

export const initials = (name: string): string =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

export interface RenderOptions {
  /** Draw nodes as plain glowing stars instead of avatar circles (the hero's constellation) */
  stars?: boolean
  /** Small solid dots, for dense graphs where initials wouldn't be legible */
  plain?: boolean
  nodeR?: number
}

export const edgeMarkup = (e: Edge): string =>
  `<path class="g-edge${e.merge ? ' merge' : ''}" data-from="${e.from}" data-to="${e.to}" data-c="${e.color}" d="${e.d}" stroke="var(--lane-${e.color})" />`

export function nodeMarkup(c: Commit, x: number, y: number, r: number, o: RenderOptions = {}): string {
  const color = `var(--lane-${c.color})`
  const isMerge = c.parents.length > 1
  const head = `data-id="${c.id}" data-c="${c.color}" transform="translate(${x} ${y})"`
  if (o.stars) {
    return `<g class="g-node star" ${head}><circle class="halo" r="${r * 2.6}" fill="${color}"/><circle r="${isMerge ? r * 0.7 : r}" fill="${color}"/><circle r="${r * 0.42}" fill="#fff" opacity=".85"/></g>`
  }
  if (isMerge) return `<g class="g-node merge" ${head}><circle r="${Math.max(3.5, r * 0.48)}" fill="${color}"/></g>`
  if (o.plain) return `<g class="g-node plain" ${head}><circle r="${r}" fill="${color}" stroke="var(--bg)" stroke-width="1.5"/></g>`
  return `<g class="g-node" ${head}><circle r="${r}" fill="${color}"/><text y="0.5" text-anchor="middle" dominant-baseline="central" font-size="${(r * 0.78).toFixed(1)}">${initials(c.author)}</text></g>`
}

/** Renders edges then nodes into an <svg>; elements carry data-id / data-from / data-to for animation. */
export function renderGraph(svg: SVGSVGElement, commits: Commit[], m: Metrics, o: RenderOptions = {}): void {
  const r = o.nodeR ?? Math.min(m.rowH * 0.32, 10)
  svg.innerHTML =
    `<g class="g-edges">${layoutEdges(commits, m).map(edgeMarkup).join('')}</g>` +
    `<g class="g-nodes">${commits.map((c, i) => nodeMarkup(c, laneX(c.lane, m), rowY(i, m), r, o)).join('')}</g>`
}

/**
 * Readies every edge for a draw-on animation: sets its dash to its own length and hides it. Animating
 * strokeDashoffset to 0 then draws it from the child down, or with `upward` from the parent up.
 */
export function primeEdges(svg: SVGSVGElement, upward = false): SVGPathElement[] {
  const paths = [...svg.querySelectorAll<SVGPathElement>('.g-edge')]
  for (const p of paths) {
    const len = Math.ceil(p.getTotalLength()) + 1
    p.style.strokeDasharray = `${len} ${len}`
    p.style.strokeDashoffset = `${upward ? -len : len}`
  }
  return paths
}

/** Position of `el` inside `ancestor`, ignoring transforms (so tilts and parallax don't skew it). */
export function offsetWithin(el: HTMLElement, ancestor: HTMLElement): { x: number; y: number } {
  let x = 0
  let y = 0
  let n: HTMLElement | null = el
  while (n && n !== ancestor) {
    x += n.offsetLeft
    y += n.offsetTop
    n = n.offsetParent as HTMLElement | null
  }
  return { x, y }
}
