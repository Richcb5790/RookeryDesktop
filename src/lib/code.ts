// The little bit of code rendering the demos share: escaping, enough TypeScript highlighting to
// read as code, and numbered lines.

export const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Just enough TypeScript highlighting for the demos. Conflict markers are left plain. */
export function hl(src: string): string {
  if (/^(<{7}|={7}|>{7})/.test(src)) return esc(src)
  return src.replace(
    /('[^']*')|\b(export|function|const|return)\b|\b(number)\b|\b(\d+)\b|\b([A-Za-z_]\w*)(?=\()/g,
    (_m, s: string, k: string, t: string, n: string, f: string) =>
      s ? `<span class="tk-s">${esc(s)}</span>` : k ? `<span class="tk-k">${k}</span>` : t ? `<span class="tk-t">${t}</span>` : n ? `<span class="tk-n">${n}</span>` : `<span class="tk-f">${f}</span>`
  )
}

export const line = (n: number | string, text: string, cls = ''): string => `<span class="ln ${cls}"><i>${n}</i><span>${hl(text)}</span></span>`

export const lines = (rows: [string, string][]): string => rows.map(([t, cls], i) => line(i + 1, t, cls)).join('')
