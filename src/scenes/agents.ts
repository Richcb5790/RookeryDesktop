import { esc, line, lines } from '../lib/code'
import { icon } from '../lib/icons'
import { gsap, ScrollTrigger } from '../lib/scroll'

// Local agents: pick an agent (the command line and the demos follow), watch it resolve a conflict,
// explain a commit and write a commit message. Each demo plays when it comes into view, and Replay
// runs it again.

const OURS = ['export function countdown(seconds: number) {', '  const clamped = Math.max(0, seconds)', '  return formatTime(clamped)', '}']
const THEIRS = ['export function countdown(seconds: number) {', "  telemetry.track('countdown', seconds)", '  return formatTime(seconds)', '}']

const CONFLICTED: [string, string][] = [
  ['export function countdown(seconds: number) {', ''],
  ['<<<<<<< HEAD', 'marker'],
  ['  const clamped = Math.max(0, seconds)', ''],
  ['  return formatTime(clamped)', ''],
  ['=======', 'marker'],
  ["  telemetry.track('countdown', seconds)", ''],
  ['  return formatTime(seconds)', ''],
  ['>>>>>>> feature/telemetry', 'marker'],
  ['}', '']
]

const RESOLVED: [string, string][] = [
  ['export function countdown(seconds: number) {', ''],
  ['  const clamped = Math.max(0, seconds)', 'from-ours'],
  ["  telemetry.track('countdown', clamped)", 'from-theirs'],
  ['  return formatTime(clamped)', 'from-ours'],
  ['}', '']
]

const REASON = 'I kept the clamp from main and the tracking call from feature/telemetry, and tracked the clamped value so both sides agree.'

const EXPLANATION: [tag: 'h5' | 'p' | 'li', text: string][] = [
  ['h5', 'What changes'],
  ['p', "The docking handshake now retries when the station doesn't answer within two seconds: up to three attempts, waiting a little longer each time."],
  ['li', '`docking/handshake.ts` wraps `sendHello` in a retry loop with backoff.'],
  ['li', '`docking/errors.ts` adds `HandshakeTimeout`, thrown after the last attempt.'],
  ['h5', 'Worth a look'],
  ['p', 'A station that is slow rather than gone now takes up to 14 seconds to fail, so the docking screen should show progress while it waits.']
]

const SUMMARY = 'Retry the docking handshake on timeout'
const BODY = 'The station sometimes answers late. Retry up to three times with backoff, and throw HandshakeTimeout after the last attempt.'

const AGENT_NAMES: Record<string, string> = {
  'Claude Code': 'Claude Code',
  Codex: 'Codex',
  'Copilot CLI': 'Copilot CLI',
  'Gemini CLI': 'Gemini CLI',
  'Custom command': 'my-agent'
}

function inlineCode(text: string): string {
  return esc(text).replace(/`([^`]+)`/g, '<code>$1</code>')
}

/** The explanation's final HTML, with every word wrapped so it can stream in. */
function explanationHtml(): string {
  const wrap = (html: string): string =>
    html.replace(/(<code>[^<]*<\/code>|[^\s<]+)/g, (w) => `<span class="w">${w}</span>`)
  let out = ''
  let inList = false
  for (const [tag, text] of EXPLANATION) {
    if (tag === 'li' && !inList) {
      out += '<ul>'
      inList = true
    }
    if (tag !== 'li' && inList) {
      out += '</ul>'
      inList = false
    }
    out += `<${tag}>${wrap(inlineCode(text))}</${tag}>`
  }
  if (inList) out += '</ul>'
  return out
}

export function initAgents(reduced: boolean): void {
  const chips = [...document.querySelectorAll<HTMLButtonElement>('#agent-chips button')]
  const cmd = document.getElementById('agent-cmd')!
  const cfName = document.getElementById('cf-agent-name')!
  const exName = document.getElementById('ex-agent-name')!
  const cmName = document.getElementById('cm-agent-name')!

  // ---- Agent picker (a tab list: arrow keys move between agents)
  let typing: gsap.core.Tween | null = null
  const select = (chip: HTMLButtonElement, focus = false): void => {
    chips.forEach((c) => {
      const on = c === chip
      c.setAttribute('aria-selected', String(on))
      c.tabIndex = on ? 0 : -1
    })
    if (focus) chip.focus()
    const name = AGENT_NAMES[chip.textContent!.trim()] ?? 'Your agent'
    cfName.textContent = `${name}'s`
    exName.textContent = name
    cmName.textContent = name
    const full = chip.dataset.cmd!
    typing?.kill()
    if (reduced) {
      cmd.textContent = full
      return
    }
    const p = { n: 0 }
    typing = gsap.to(p, {
      n: full.length,
      duration: Math.min(0.9, full.length * 0.022),
      ease: 'none',
      onUpdate: () => {
        cmd.textContent = full.slice(0, Math.round(p.n))
      }
    })
  }
  chips.forEach((chip, i) => {
    chip.tabIndex = i === 0 ? 0 : -1
    chip.addEventListener('click', () => select(chip))
    chip.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
      if (!d) return
      e.preventDefault()
      select(chips[(i + d + chips.length) % chips.length], true)
    })
  })

  // ---- Conflict demo
  document.getElementById('cf-ours')!.innerHTML = OURS.map((t, i) => line(i + 1, t, i === 1 || i === 2 ? 'chg' : '')).join('')
  document.getElementById('cf-theirs')!.innerHTML = THEIRS.map((t, i) => line(i + 1, t, i === 1 || i === 2 ? 'chg' : '')).join('')
  const out = document.getElementById('cf-output')!
  const proposal = document.getElementById('cf-proposal')!
  const reason = document.getElementById('cf-reason')!
  const save = document.getElementById('cf-save')!
  const you = document.getElementById('cf-you')!
  const aiBtn = document.getElementById('cf-ai')!
  const spinner = proposal.querySelector<HTMLImageElement>('.spin')!
  const done = document.createElement('span')
  done.innerHTML = icon('check', 18)
  done.style.cssText = 'display:none;color:var(--success);flex:none'
  spinner.after(done)

  const conflictFinal = (): void => {
    out.innerHTML = lines(RESOLVED)
    gsap.set(proposal, { height: 'auto', opacity: 1, paddingTop: 10, paddingBottom: 10, borderBottomColor: 'rgba(46,63,114,.6)' })
    reason.textContent = REASON
    spinner.style.display = 'none'
    done.style.display = ''
    save.classList.add('ready')
    gsap.set(you, { opacity: 1 })
  }

  const conflictReset = (): void => {
    out.innerHTML = lines(CONFLICTED)
    gsap.set(proposal, { height: 0, opacity: 0, paddingTop: 0, paddingBottom: 0, borderBottomColor: 'transparent' })
    reason.textContent = ''
    spinner.style.display = ''
    done.style.display = 'none'
    save.classList.remove('ready')
    gsap.set(you, { opacity: 0 })
  }

  const playConflict = (): gsap.core.Timeline => {
    conflictReset()
    const tl = gsap.timeline()
    const markers = out.querySelectorAll('.ln.marker')
    tl.fromTo(markers, { opacity: 0.4 }, { opacity: 1, duration: 0.25, repeat: 3, yoyo: true }, 0)
    tl.to(aiBtn, { scale: 0.92, duration: 0.12, yoyo: true, repeat: 1, transformOrigin: '50% 50%' }, 0.7)
    tl.fromTo(aiBtn, { boxShadow: '0 0 0 0 rgba(255,201,60,0)' }, { boxShadow: '0 0 0 4px rgba(255,201,60,0.35)', duration: 0.3 }, 0.75)
    tl.to(proposal, { height: 'auto', opacity: 1, paddingTop: 10, paddingBottom: 10, borderBottomColor: 'rgba(46,63,114,.6)', duration: 0.45, ease: 'power2.out' }, 0.95)
    const p = { n: 0 }
    tl.to(p, { n: REASON.length, duration: 2, ease: 'none', onUpdate: () => (reason.textContent = REASON.slice(0, Math.round(p.n))) }, 1.3)
    tl.to(out.querySelectorAll('.ln'), { opacity: 0, x: -10, duration: 0.3, stagger: 0.04 }, 2.6)
    tl.call(() => {
      out.innerHTML = lines(RESOLVED)
      const ls = out.querySelectorAll<HTMLElement>('.ln')
      gsap.from(ls, {
        opacity: 0,
        x: (i: number) => (RESOLVED[i][1] === 'from-ours' ? -50 : RESOLVED[i][1] === 'from-theirs' ? 50 : 0),
        duration: 0.6,
        stagger: 0.12,
        ease: 'power3.out'
      })
    }, undefined, 3.1)
    tl.call(() => {
      spinner.style.display = 'none'
      done.style.display = ''
      save.classList.add('ready')
    }, undefined, 3.9)
    tl.to(aiBtn, { boxShadow: '0 0 0 0 rgba(255,201,60,0)', duration: 0.4 }, 3.9)
    tl.fromTo(you, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.5 }, 4.1)
    return tl
  }

  // ---- Explain demo
  const text = document.getElementById('ex-text')!
  const playExplain = (): gsap.core.Timeline => {
    text.innerHTML = explanationHtml()
    const cursor = document.createElement('span')
    cursor.className = 'cursor'
    const words = [...text.querySelectorAll<HTMLElement>('.w')]
    const tl = gsap.timeline()
    tl.set(words, { opacity: 0 })
    words.forEach((w, i) => {
      tl.call(() => w.after(cursor), undefined, 0.4 + i * 0.045)
      tl.to(w, { opacity: 1, duration: 0.12 }, 0.4 + i * 0.045)
    })
    tl.call(() => cursor.remove())
    return tl
  }

  // ---- Commit message demo
  const summary = document.getElementById('cm-summary')!
  const body = document.getElementById('cm-body')!
  const count = document.getElementById('cm-count')!
  const writeBtn = document.getElementById('cm-ai')!
  const note = document.getElementById('cm-note')!
  const commit = document.getElementById('cm-commit')!
  const form = summary.closest<HTMLElement>('.cm-form')!

  const messageFinal = (): void => {
    summary.textContent = SUMMARY
    body.textContent = BODY
    count.textContent = String(SUMMARY.length)
    note.classList.add('on')
    commit.classList.add('ready')
  }

  const playMessage = (): gsap.core.Timeline => {
    summary.textContent = ''
    body.textContent = ''
    count.textContent = '0'
    note.classList.remove('on')
    commit.classList.remove('ready')
    const tl = gsap.timeline()
    const s1 = { n: 0 }
    const s2 = { n: 0 }
    tl.to(writeBtn, { scale: 0.92, duration: 0.12, yoyo: true, repeat: 1, transformOrigin: '50% 50%' }, 0.5)
    tl.call(() => form.classList.add('writing'), undefined, 0.6)
    tl.to(
      s1,
      {
        n: SUMMARY.length,
        duration: 1.1,
        ease: 'none',
        onUpdate: () => {
          const n = Math.round(s1.n)
          summary.textContent = SUMMARY.slice(0, n)
          count.textContent = String(n)
        }
      },
      1.1
    )
    tl.to(s2, { n: BODY.length, duration: 2, ease: 'none', onUpdate: () => (body.textContent = BODY.slice(0, Math.round(s2.n))) }, 2.3)
    tl.call(() => {
      form.classList.remove('writing')
      note.classList.add('on')
      commit.classList.add('ready')
    })
    return tl
  }

  if (reduced) {
    conflictFinal()
    messageFinal()
    text.innerHTML = explanationHtml()
    text.querySelectorAll<HTMLElement>('.w').forEach((w) => (w.style.opacity = '1'))
    return
  }

  conflictReset()
  text.innerHTML = explanationHtml()
  let cf: gsap.core.Timeline | null = null
  let ex: gsap.core.Timeline | null = null
  let cm: gsap.core.Timeline | null = null
  ScrollTrigger.create({ trigger: '#conflict-demo', start: 'top 65%', once: true, onEnter: () => (cf = playConflict()) })
  ScrollTrigger.create({ trigger: '#explain-demo', start: 'top 65%', once: true, onEnter: () => (ex = playExplain()) })
  ScrollTrigger.create({ trigger: '#message-demo', start: 'top 70%', once: true, onEnter: () => (cm = playMessage()) })
  document.getElementById('message-replay')!.addEventListener('click', () => {
    cm?.kill()
    form.classList.remove('writing')
    cm = playMessage()
  })
  document.getElementById('conflict-replay')!.addEventListener('click', () => {
    cf?.kill()
    cf = playConflict()
  })
  document.getElementById('explain-replay')!.addEventListener('click', () => {
    ex?.kill()
    ex = playExplain()
  })
}
