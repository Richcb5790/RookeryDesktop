export type DesktopOs = 'windows' | 'mac' | 'linux'
export type DetectedOs = DesktopOs | 'mobile' | 'unknown'

export interface PlatformHints {
  /** navigator.userAgentData.platform, where the browser has it */
  uaPlatform?: string
  /** navigator.platform */
  platform?: string
  userAgent?: string
  /** navigator.maxTouchPoints, to tell an iPad (which reports itself as a Mac) from a Mac */
  maxTouchPoints?: number
}

/** Works out the visitor's operating system from whatever the browser reveals, best hint first. */
export function detectOs(h: PlatformHints): DetectedOs {
  const ua = h.userAgent ?? ''
  if (/Android|iPhone|iPad|iPod/i.test(ua)) return 'mobile'
  const hint = `${h.uaPlatform ?? ''} ${h.platform ?? ''}`.trim() || ua
  if (/Win/i.test(hint)) return 'windows'
  if (/Mac|iOS/i.test(hint)) return (h.maxTouchPoints ?? 0) > 1 ? 'mobile' : 'mac'
  if (/Android|CrOS/i.test(hint)) return /CrOS/i.test(hint) ? 'linux' : 'mobile'
  if (/Linux|X11|BSD/i.test(hint)) return 'linux'
  return 'unknown'
}

export function browserOs(): DetectedOs {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
  return detectOs({
    uaPlatform: nav.userAgentData?.platform,
    platform: nav.platform,
    userAgent: nav.userAgent,
    maxTouchPoints: nav.maxTouchPoints
  })
}

export const OS_NAMES: Record<DesktopOs, string> = {
  windows: 'Windows',
  mac: 'macOS',
  linux: 'Linux'
}
