import { describe, expect, it } from 'vitest'
import { detectOs } from '../src/downloads/os'

describe('detectOs', () => {
  it('prefers userAgentData', () => {
    expect(detectOs({ uaPlatform: 'Windows', platform: 'Win32' })).toBe('windows')
    expect(detectOs({ uaPlatform: 'macOS' })).toBe('mac')
    expect(detectOs({ uaPlatform: 'Linux' })).toBe('linux')
  })

  it('falls back to navigator.platform', () => {
    expect(detectOs({ platform: 'MacIntel', maxTouchPoints: 0 })).toBe('mac')
    expect(detectOs({ platform: 'Linux x86_64' })).toBe('linux')
  })

  it('treats phones and iPads (which claim to be Macs) as mobile', () => {
    expect(detectOs({ platform: 'MacIntel', maxTouchPoints: 5 })).toBe('mobile')
    expect(detectOs({ platform: 'Linux armv8l', userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8)' })).toBe('mobile')
    expect(detectOs({ platform: 'iPhone', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' })).toBe('mobile')
  })

  it('uses the user agent when nothing else is known', () => {
    expect(detectOs({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' })).toBe('linux')
    expect(detectOs({})).toBe('unknown')
  })
})
