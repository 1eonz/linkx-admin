import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const outputDir = path.dirname(fileURLToPath(import.meta.url))
const evidencePath = path.join(outputDir, 'mobile-overflow-evidence.json')
const baseEvidence = JSON.parse(await fs.readFile(evidencePath, 'utf8'))
const targets = await fetch('http://localhost:9339/json/list').then((response) => response.json())
const target = targets.find((entry) => entry.id === baseEvidence.targetId)
if (!target?.webSocketDebuggerUrl) throw new Error(`Mobile target not found: ${baseEvidence.targetId}`)

const socket = new WebSocket(target.webSocketDebuggerUrl)
let nextId = 0
const pending = new Map()
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data)
  if (!message.id) return
  const entry = pending.get(message.id)
  if (!entry) return
  pending.delete(message.id)
  if (message.error) entry.reject(new Error(message.error.message))
  else entry.resolve(message.result)
})
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true })
  socket.addEventListener('error', reject, { once: true })
})

const send = (method, params = {}) => {
  const id = ++nextId
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    socket.send(JSON.stringify({ id, method, params }))
  })
}
const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text)
  }
  return result.result?.value
}

const overlays = await evaluate(`(() => [...document.querySelectorAll('.impeccable-overlay:not(.impeccable-banner)')].map((overlay, index) => {
  const target = overlay._targetEl
  const rect = target?.getBoundingClientRect()
  const label = overlay.querySelector('.impeccable-label')
  const closest = (selector) => target?.closest(selector) || null
  const ancestry = []
  for (let element = target, depth = 0; element && depth < 5; element = element.parentElement, depth += 1) {
    ancestry.push({
      tag: element.tagName.toLowerCase(),
      id: element.id || '',
      className: typeof element.className === 'string' ? element.className.slice(0, 180) : '',
      text: element.innerText?.trim().replace(/\\s+/g, ' ').slice(0, 100) || '',
    })
  }
  const style = target ? getComputedStyle(target) : null
  return {
    index,
    rule: label?.innerText?.trim() || overlay.innerText?.trim() || '',
    target: target ? {
      tag: target.tagName.toLowerCase(),
      id: target.id || '',
      className: typeof target.className === 'string' ? target.className.slice(0, 240) : '',
      text: target.innerText?.trim().replace(/\\s+/g, ' ').slice(0, 220) || '',
      rect: rect ? { left: rect.left, right: rect.right, width: rect.width, top: rect.top, bottom: rect.bottom } : null,
      computed: style ? {
        width: style.width,
        minWidth: style.minWidth,
        maxWidth: style.maxWidth,
        overflowX: style.overflowX,
        whiteSpace: style.whiteSpace,
        opacity: style.opacity,
      } : null,
      region: closest('.lx-transfer-panel') ? 'component' : closest('.transfer-panel-demo') ? 'demo-host' : closest('.VPDoc') ? 'docs-content' : 'docs-shell-or-other',
      ancestry,
    } : null,
    overlayBox: (() => {
      const box = overlay.getBoundingClientRect()
      const style = getComputedStyle(overlay)
      return { left: box.left, right: box.right, width: box.width, position: style.position, display: style.display }
    })(),
  }
}))()`)

const widths = await evaluate(`(() => ({
  innerWidth: window.innerWidth,
  visualViewportWidth: window.visualViewport?.width ?? null,
  rootClientWidth: document.documentElement.clientWidth,
  rootScrollWidth: document.documentElement.scrollWidth,
  bodyClientWidth: document.body.clientWidth,
  bodyScrollWidth: document.body.scrollWidth,
}))()`)
await evaluate(`new Promise((resolve) => {
  const style = document.createElement('style')
  style.id = 'assessment-b-hide-overlays-probe'
  style.textContent = '.impeccable-overlay, .impeccable-label, .impeccable-tooltip { display: none !important; }'
  document.head.appendChild(style)
  requestAnimationFrame(() => requestAnimationFrame(resolve))
})`)
const widthsWithOverlaysHidden = await evaluate(`(() => ({
  innerWidth: window.innerWidth,
  visualViewportWidth: window.visualViewport?.width ?? null,
  rootClientWidth: document.documentElement.clientWidth,
  rootScrollWidth: document.documentElement.scrollWidth,
  bodyClientWidth: document.body.clientWidth,
  bodyScrollWidth: document.body.scrollWidth,
}))()`)
await evaluate("document.getElementById('assessment-b-hide-overlays-probe')?.remove()")

const result = {
  capturedAt: new Date().toISOString(),
  targetUrl: target.url,
  targetId: target.id,
  widthsAfterInjection: widths,
  widthsWithOverlaysTemporarilyHidden: widthsWithOverlaysHidden,
  hiddenOverlayScrollWidthDelta: widthsWithOverlaysHidden.rootScrollWidth - widths.rootScrollWidth,
  overlayTargets: overlays,
  attribution: widthsWithOverlaysHidden.rootScrollWidth === baseEvidence.beforeInjection.viewport.rootScrollWidth
    ? 'documentElement overflow returns to its pre-injection width when Impeccable overlay layers are hidden; the scrollWidth increase is attributable to the overlay layer, not the LxTransferPanel component.'
    : 'hiding overlay layers did not fully return documentElement scrollWidth to its pre-injection width; inspect overlay targets and remaining page overflow separately.',
}
baseEvidence.overlayAttribution = result
await fs.writeFile(evidencePath, `${JSON.stringify(baseEvidence, null, 2)}\n`)
await fs.writeFile(path.join(outputDir, 'mobile-overlay-attribution.json'), `${JSON.stringify(result, null, 2)}\n`)
console.log(JSON.stringify(result, null, 2))
socket.close()
