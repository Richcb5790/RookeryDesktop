// Stroke icons drawn for the site on a 24px grid, plus brand marks from simple-icons (CC0).
import { siApple, siBitbucket, siGithub, siGitlab, siJira, siLinux, siTrello } from 'simple-icons'

const STROKE: Record<string, string> = {
  branch: '<circle cx="6" cy="5" r="2.2"/><circle cx="6" cy="19" r="2.2"/><circle cx="18" cy="7" r="2.2"/><path d="M6 7.2v9.6M18 9.2c0 3.6-2.4 5-6 5.4-3 .3-5.4 1-6 2.6"/>',
  pull: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
  push: '<path d="M12 20V9M7 13.5l5-5 5 5M5 4h14"/>',
  isolate: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  terminal: '<path d="M4.5 6.5l5.5 5.5-5.5 5.5M12.5 18.5h7"/>',
  details: '<rect x="3.5" y="4" width="17" height="16" rx="2.5"/><path d="M14 4v16"/>',
  sparkle: '<path d="M11 3.5l1.7 4.8 4.8 1.7-4.8 1.7L11 16.5l-1.7-4.8L4.5 10l4.8-1.7z"/><path d="M18.5 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  merge: '<circle cx="6" cy="5" r="2.2"/><circle cx="6" cy="19" r="2.2"/><circle cx="18" cy="15" r="2.2"/><path d="M6 7.2v9.6M6 7.2c0 4.5 3.5 7.8 9.8 7.8"/>',
  pr: '<circle cx="6" cy="5" r="2.2"/><circle cx="6" cy="19" r="2.2"/><circle cx="18" cy="19" r="2.2"/><path d="M6 7.2v9.6M18 16.8V9a3 3 0 0 0-3-3h-4M13 3.5L10.5 6 13 8.5"/>',
  issue: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>',
  rocket: '<path d="M12 2.8c3.4 2.2 4.9 5.8 4.4 10.4L14.2 16H9.8l-2.2-2.8C7.1 8.6 8.6 5 12 2.8z"/><circle cx="12" cy="9.3" r="1.7"/><path d="M8 13.2l-2.8 2.1.8 3.2 3-1.2M16 13.2l2.8 2.1-.8 3.2-3-1.2M10.6 18.6l1.4 2.6 1.4-2.6"/>',
  map: '<path d="M3.5 6.5L9 4l6 2.5L20.5 4v13.5L15 20l-6-2.5-5.5 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" stroke-width="2.6"/>',
  graph: '<circle cx="12" cy="12" r="3.2"/><path d="M3 12h5.8M15.2 12H21"/>',
  layers: '<path d="M12 3.5l8.5 4.5-8.5 4.5L3.5 8z"/><path d="M3.5 12l8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5"/>',
  reorder: '<path d="M7 4v16M4 7l3-3 3 3M17 20V4M14 17l3 3 3-3"/>',
  anchor: '<circle cx="12" cy="5.5" r="2.2"/><path d="M12 7.7V21M8 11h8M4.5 13.5c0 4 3.5 7.5 7.5 7.5s7.5-3.5 7.5-7.5"/>',
  worktree: '<path d="M4 4v13a2 2 0 0 0 2 2h4M4 9h6"/><rect x="11.5" y="6" width="9" height="6" rx="1.5"/><rect x="11.5" y="15" width="9" height="6" rx="1.5"/>',
  box: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="M20.5 15.5l-5-5-9 9"/>',
  keyboard: '<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6.5 10h.01M10 10h.01M14 10h.01M17.5 10h.01" stroke-width="2.4"/><path d="M7.5 14h9"/>',
  users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9.5" r="2.4"/><path d="M16.5 14.6c2.2.2 3.6 1.7 4 4.4"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V7.5A1.5 1.5 0 0 1 5.5 6H10"/>',
  shield: '<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8.5-8.5M16 7l2.5 2.5M14 9l2 2"/>',
  download: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowDown: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>',
  cloud: '<path d="M7 18.5a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 8.6a4 4 0 0 1-.5 9.9z"/>',
  folder: '<path d="M3.5 7a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
  warning: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  history: '<path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"/><path d="M3.5 4v4h4M12 7.5V12l3 2"/>',
  flow: '<circle cx="6" cy="5" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="6" cy="19" r="2"/><path d="M6 7v10M7.8 6c5 1 8.2 2.8 8.8 4.4M16.6 13.6c-.6 1.6-3.8 3.4-8.8 4.4"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4.5V11h-6.5"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
  // A generic board-and-pipeline glyph, standing in for Azure DevOps (its logo isn't in simple-icons)
  pipeline: '<rect x="3.5" y="4" width="7" height="7" rx="1.6"/><rect x="13.5" y="13" width="7" height="7" rx="1.6"/><path d="M10.5 7.5h3.5a3 3 0 0 1 3 3V13M7 11v3.5a3 3 0 0 0 3 3h3.5"/>',
  plug: '<path d="M9 3v5M15 3v5M6.5 8h11v3.5a5.5 5.5 0 0 1-11 0zM12 17v4"/>'
}

const BRAND: Record<string, string> = {
  github: siGithub.path,
  gitlab: siGitlab.path,
  bitbucket: siBitbucket.path,
  jira: siJira.path,
  trello: siTrello.path,
  apple: siApple.path,
  linux: siLinux.path,
  // Not in simple-icons, so a plain four-pane window.
  windows: 'M2 4.6 10.2 3.5v7.9H2zM11.2 3.4 22 2v9.4H11.2zM2 12.4h8.2v7.9L2 19.2zM11.2 12.4H22V22l-10.8-1.5z'
}

export function icon(name: keyof typeof STROKE | string, size = 18, cls = ''): string {
  const body = STROKE[name]
  if (body) {
    return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`
  }
  const path = BRAND[name]
  if (!path) throw new Error(`No icon called ${name}`)
  return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${path}"/></svg>`
}

/** Fills every <i data-icon="name" data-size="18"> placeholder in the page. */
export function hydrateIcons(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('i[data-icon]').forEach((el) => {
    const size = Number(el.dataset.size ?? 18)
    el.outerHTML = icon(el.dataset.icon!, size, el.className)
  })
}
