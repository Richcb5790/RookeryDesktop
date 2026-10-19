import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
import '@fontsource-variable/inter'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'

import './styles/tokens.css'
import './styles/base.css'
import './styles/hero.css'
import './styles/graph.css'
import './styles/integrations.css'
import './styles/isolate.css'
import './styles/agents.css'
import './styles/features.css'
import './styles/download.css'
import './styles/footer.css'

import { hydrateIcons } from './lib/icons'
import { finePointer, markMotion, reducedMotion } from './lib/motion'
import { pointerParallax, reveals, scrollParallax, startPointer, tilt } from './lib/parallax'
import { initScroll, ScrollTrigger } from './lib/scroll'
import { startStarfield } from './lib/starfield'
import { initAgents } from './scenes/agents'
import { initDownload } from './scenes/download'
import { initFeatures } from './scenes/features'
import { initFooter } from './scenes/footer'
import { initGraph } from './scenes/graph'
import { initHero } from './scenes/hero'
import { initIntegrations } from './scenes/integrations'
import { initIsolate } from './scenes/isolate'
import { initNav } from './scenes/nav'

markMotion()
hydrateIcons()
initScroll(reducedMotion)

const lively = !reducedMotion
if (lively && finePointer) {
  startPointer()
  pointerParallax(document)
  tilt(document)
}
startStarfield(document.getElementById('starfield') as HTMLCanvasElement, reducedMotion)

initHero(reducedMotion)
initGraph(reducedMotion)
initIntegrations(reducedMotion)
initIsolate(reducedMotion)
initAgents(reducedMotion)
initFeatures(reducedMotion)
initDownload(reducedMotion)
initFooter(reducedMotion)
// Created after the pinned scenes, so its section positions include their pin spacing.
initNav()

if (lively) {
  scrollParallax(document)
  reveals(document)
}

if (import.meta.env.DEV) Object.assign(window, { ScrollTrigger })

// Web fonts change line lengths, and so the heights pinned scenes measured.
document.fonts.ready.then(() => ScrollTrigger.refresh())
