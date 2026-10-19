import type { Commit } from '../lib/graph'

// Sample histories for the demos. Rows run newest first; every parent sits below its child.

const ADA = 'Ada Okafor'
const MIKA = 'Mika Lund'
const SAM = 'Sam Reyes'
const PRIYA = 'Priya Nair'
const JONAS = 'Jonas Weber'

/** The commit graph scene (and the hero's constellation): four lines of work, three merges. */
export const TOUR: Commit[] = [
  { id: 'm5', lane: 0, color: 0, parents: ['m4', 't4'], msg: "Merge branch 'feature/telemetry'", author: ADA, refs: [{ name: 'main', head: true }] },
  { id: 't4', lane: 2, color: 2, parents: ['t3', 's1'], msg: "Merge branch 'feature/sensors' into feature/telemetry", author: MIKA, refs: [{ name: 'feature/telemetry' }] },
  { id: 's1', lane: 3, color: 3, parents: ['t2'], msg: 'Add the gyroscope driver', author: PRIYA, refs: [{ name: 'feature/sensors' }] },
  { id: 't3', lane: 2, color: 2, parents: ['t2'], msg: 'Stream telemetry to the dashboard', author: MIKA },
  { id: 'd2', lane: 1, color: 1, parents: ['d1', 't2'], msg: "Merge branch 'feature/telemetry' into develop", author: SAM, refs: [{ name: 'develop' }] },
  { id: 't2', lane: 2, color: 2, parents: ['t1'], msg: 'Batch packets by orbit', author: MIKA },
  { id: 'd1', lane: 1, color: 1, parents: ['m3'], msg: 'Bump the flight SDK', author: SAM },
  { id: 'm4', lane: 0, color: 0, parents: ['m3'], msg: 'Fix the launch timer drift', author: ADA },
  { id: 't1', lane: 2, color: 2, parents: ['m2'], msg: 'Start the telemetry service', author: MIKA },
  { id: 'm3', lane: 0, color: 0, parents: ['m2'], msg: 'Document the docking API', author: JONAS },
  { id: 'm2', lane: 0, color: 0, parents: ['m1'], msg: 'Add the docking handshake', author: ADA },
  { id: 'm1', lane: 0, color: 0, parents: [], msg: 'Initial commit', author: ADA }
]

/** The isolate scene's busy history: seven lines of work around feature/docking. */
export const BUSY: Commit[] = [
  { id: 'm9', lane: 0, color: 0, parents: ['m8', 'k5'], msg: "Merge branch 'feature/docking'", author: ADA, refs: [{ name: 'main', head: true }] },
  { id: 'r3', lane: 4, color: 4, parents: ['r2'], msg: 'Write the 1.2 release notes', author: JONAS, refs: [{ name: 'release/1.2' }] },
  { id: 'h2', lane: 5, color: 5, parents: ['h1'], msg: 'Dim the HUD at night', author: PRIYA, refs: [{ name: 'fix/hud' }] },
  { id: 'k5', lane: 2, color: 2, parents: ['k4', 's2'], msg: "Merge branch 'feature/sensors' into feature/docking", author: MIKA, refs: [{ name: 'feature/docking' }] },
  { id: 's2', lane: 3, color: 3, parents: ['s1'], msg: 'Calibrate the proximity sensor', author: PRIYA, refs: [{ name: 'feature/sensors' }] },
  { id: 'e3', lane: 6, color: 6, parents: ['e2'], msg: 'Chart packet loss', author: SAM, refs: [{ name: 'feature/telemetry' }] },
  { id: 'm8', lane: 0, color: 0, parents: ['m7'], msg: 'Pin the flight SDK', author: ADA },
  { id: 'd4', lane: 1, color: 1, parents: ['d3', 'k4'], msg: "Merge branch 'feature/docking' into develop", author: SAM, refs: [{ name: 'develop' }] },
  { id: 'k4', lane: 2, color: 2, parents: ['k3'], msg: 'Retry the handshake on timeout', author: MIKA },
  { id: 'r2', lane: 4, color: 4, parents: ['r1'], msg: 'Freeze the UI strings', author: JONAS },
  { id: 's1', lane: 3, color: 3, parents: ['m6'], msg: 'Read the proximity sensor', author: PRIYA },
  { id: 'k3', lane: 2, color: 2, parents: ['k2'], msg: 'Align the docking ports', author: MIKA },
  { id: 'e2', lane: 6, color: 6, parents: ['d2'], msg: 'Batch packets by orbit', author: SAM },
  { id: 'h1', lane: 5, color: 5, parents: ['m6'], msg: 'Fix the HUD contrast', author: PRIYA },
  { id: 'd3', lane: 1, color: 1, parents: ['d2'], msg: 'Bump the test fixtures', author: SAM },
  { id: 'k2', lane: 2, color: 2, parents: ['k1'], msg: 'Model the docking clamps', author: MIKA },
  { id: 'r1', lane: 4, color: 4, parents: ['m6'], msg: 'Start release 1.2', author: JONAS },
  { id: 'm7', lane: 0, color: 0, parents: ['m6'], msg: 'Fix the launch timer drift', author: ADA },
  { id: 'k1', lane: 2, color: 2, parents: ['m6'], msg: 'Sketch the docking handshake', author: MIKA },
  { id: 'd2', lane: 1, color: 1, parents: ['d1'], msg: 'Share the orbit math', author: SAM },
  { id: 'm6', lane: 0, color: 0, parents: ['m5'], msg: 'Document the docking API', author: JONAS },
  { id: 'd1', lane: 1, color: 1, parents: ['m5'], msg: 'Set up the develop branch', author: SAM },
  { id: 'm5', lane: 0, color: 0, parents: ['m4'], msg: 'Add the handshake spec', author: ADA },
  { id: 'm4', lane: 0, color: 0, parents: [], msg: 'Initial commit', author: ADA }
]

/**
 * feature/docking isolated, as docs/LINEAGE.md describes it: the spine from the tip to the fork point
 * plus one commit below, the side commits of its incoming merge, and its outgoing merges. Parents are
 * rewritten to stay inside the subset, and the branch moves to lane 0.
 */
export const ISOLATED: Commit[] = [
  { id: 'm9', lane: 2, color: 0, parents: ['k5'], msg: "Merge branch 'feature/docking'", author: ADA, refs: [{ name: 'main', head: true }] },
  { id: 'k5', lane: 0, color: 2, parents: ['k4', 's2'], msg: "Merge branch 'feature/sensors' into feature/docking", author: MIKA, refs: [{ name: 'feature/docking' }] },
  { id: 's2', lane: 1, color: 3, parents: ['s1'], msg: 'Calibrate the proximity sensor', author: PRIYA, refs: [{ name: 'feature/sensors' }] },
  { id: 'd4', lane: 2, color: 1, parents: ['k4'], msg: "Merge branch 'feature/docking' into develop", author: SAM, refs: [{ name: 'develop' }] },
  { id: 'k4', lane: 0, color: 2, parents: ['k3'], msg: 'Retry the handshake on timeout', author: MIKA },
  { id: 's1', lane: 1, color: 3, parents: ['m6'], msg: 'Read the proximity sensor', author: PRIYA },
  { id: 'k3', lane: 0, color: 2, parents: ['k2'], msg: 'Align the docking ports', author: MIKA },
  { id: 'k2', lane: 0, color: 2, parents: ['k1'], msg: 'Model the docking clamps', author: MIKA },
  { id: 'k1', lane: 0, color: 2, parents: ['m6'], msg: 'Sketch the docking handshake', author: MIKA },
  { id: 'm6', lane: 0, color: 0, parents: ['m5'], msg: 'Document the docking API', author: JONAS },
  { id: 'm5', lane: 0, color: 0, parents: [], msg: 'Add the handshake spec', author: ADA }
]

/** The branch's own commits, drawn bright when isolated; the rest of the subset is context. */
export const SPINE = new Set(['k5', 'k4', 'k3', 'k2', 'k1'])

export const SHA: Record<string, string> = {
  k5: '16855be',
  m9: 'edea25d',
  d4: 'fdf351d',
  m6: '7157e20',
  k4: 'c5cc477'
}
