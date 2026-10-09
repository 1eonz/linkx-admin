import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const outputDir = path.dirname(fileURLToPath(import.meta.url))
const browserPort = 9339
const detectorUrl = 'http://localhost:8417/detect.js'
const targetUrl = 'http://127.0.0.1:4185/components/lxtransferpanel'
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

class CDP {
  constructor(url) {
    this.socket = new WebSocket(url)
    this.nextId = 0
    this.pending = new Map()
    this.socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data)
      if (!message.id) return
      const pending = this.pending.get(message.id)
      if (!pending) return
      this.pending.delete(message.id)
      if (message.error) pending.reject(new Error(message.error.message))
      else pending.resolve(message.result)
    })
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true })
      this.socket.addEventListener('error', reject, { once: true })
    })
  }

  send(method, params = {}) {
    const id = ++this.nextId
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }

  async evaluate(expression, awaitPromise = false) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise,
      returnByValue: true,
      userGesture: true,
    })
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text)
    }
    return result.result?.value
  }

  async screenshot(name) {
    const result = await this.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      captureBeyondViewport: false,
    })
    await fs.writeFile(path.join(outputDir, name), Buffer.from(result.data, 'base64'))
  }
}

const target = await fetch(`http://localhost:${browserPort}/json/new?${encodeURIComponent(targetUrl)}`, {
  method: 'PUT',
}).then((response) => response.json())
const cdp = new CDP(target.webSocketDebuggerUrl)
await cdp.connect()
await cdp.send('Page.enable')
await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
})
await cdp.send('Page.navigate', { url: targetUrl })

let mounted = false
for (let attempt = 0; attempt < 60; attempt += 1) {
  mounted = await cdp.evaluate("Boolean(document.querySelector('.transfer-panel-demo') && document.querySelector('.lx-transfer-panel'))")
  if (mounted) break
  await sleep(500)
}
if (!mounted) throw new Error('The mobile docs target did not mount the demo and component.')

await cdp.evaluate("window.scrollTo(0, 0)")
await sleep(500)

const measure = async (phase) => cdp.evaluate(`(() => {
  const describe = (selector) => {
    const element = document.querySelector(selector)
    if (!element) return null
    const rect = element.getBoundingClientRect()
    const style = getComputedStyle(element)
    return {
      selector,
      tag: element.tagName.toLowerCase(),
      className: typeof element.className === 'string' ? element.className : '',
      text: element.innerText?.trim().replace(/\\s+/g, ' ').slice(0, 120) || '',
      rect: { left: rect.left, right: rect.right, width: rect.width },
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      computed: {
        width: style.width,
        minWidth: style.minWidth,
        maxWidth: style.maxWidth,
        boxSizing: style.boxSizing,
        overflowX: style.overflowX,
        whiteSpace: style.whiteSpace,
        overflowWrap: style.overflowWrap,
      },
    }
  }
  const viewportWidth = document.documentElement.clientWidth
  const overflowCandidates = [...document.querySelectorAll('body *')]
    .filter((element) => !element.closest('.impeccable-overlay, .impeccable-label, .impeccable-banner'))
    .map((element) => {
      const rect = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      return {
        tag: element.tagName.toLowerCase(),
        className: typeof element.className === 'string' ? element.className : '',
        text: element.innerText?.trim().replace(/\\s+/g, ' ').slice(0, 100) || '',
        left: rect.left,
        right: rect.right,
        width: rect.width,
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
        minWidth: style.minWidth,
        overflowX: style.overflowX,
      }
    })
    .filter((element) => element.width > 0 && element.right > viewportWidth + 1)
    .sort((left, right) => right.right - left.right)
    .slice(0, 20)
  const root = document.documentElement
  const body = document.body
  return {
    phase: ${JSON.stringify(phase)},
    url: location.href,
    title: document.title,
    viewport: {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      rootClientWidth: root.clientWidth,
      rootScrollWidth: root.scrollWidth,
      bodyClientWidth: body.clientWidth,
      bodyScrollWidth: body.scrollWidth,
    },
    elements: [
      describe('body'),
      describe('.VPContent'),
      describe('.VPDoc'),
      describe('.content-container'),
      describe('.transfer-panel-demo'),
      describe('.transfer-panel-demo__surface'),
      describe('.lx-transfer-panel'),
      describe('.lx-transfer-panel__panel'),
      describe('.lx-transfer-panel__tree'),
      describe('.lx-transfer-panel__selected'),
    ].filter(Boolean),
    overflowCandidates,
    overlayCount: document.querySelectorAll('.impeccable-overlay:not(.impeccable-banner)').length,
  }
})()`)

const beforeInjection = await measure('before-injection')
await cdp.screenshot('mobile-overflow-before-injection.png')
const injection = await cdp.evaluate(`new Promise((resolve) => {
  document.title = '[Human] Wave7 mobile overflow comparison'
  const script = document.createElement('script')
  script.id = 'assessment-b-mobile-detector'
  script.src = ${JSON.stringify(detectorUrl)}
  script.onload = () => resolve({ status: 'loaded', src: script.src })
  script.onerror = () => resolve({ status: 'error', src: script.src })
  document.head.appendChild(script)
})`, true)
await sleep(3000)
const afterInjection = await measure('after-injection')
await cdp.screenshot('mobile-overflow-after-injection.png')
const overlayTargets = await cdp.evaluate(`(() => [...document.querySelectorAll('.impeccable-overlay:not(.impeccable-banner)')].map((overlay, index) => {
  const target = overlay._targetEl
  const targetRect = target?.getBoundingClientRect()
  const label = overlay.querySelector('.impeccable-label')
  const region = target?.closest('.lx-transfer-panel')
    ? 'component'
    : target?.closest('.transfer-panel-demo')
      ? 'demo-host'
      : target?.closest('.VPDoc')
        ? 'docs-content'
        : 'docs-shell-or-other'
  const overlayRect = overlay.getBoundingClientRect()
  return {
    index,
    rule: label?.innerText?.trim() || overlay.innerText?.trim() || '',
    region,
    target: target ? {
      tag: target.tagName.toLowerCase(),
      className: typeof target.className === 'string' ? target.className.slice(0, 180) : '',
      text: target.innerText?.trim().replace(/\\s+/g, ' ').slice(0, 140) || '',
      rect: targetRect ? { left: targetRect.left, right: targetRect.right, width: targetRect.width } : null,
      opacity: getComputedStyle(target).opacity,
    } : null,
    overlayBox: { left: overlayRect.left, right: overlayRect.right, width: overlayRect.width },
  }
}))()`)
await cdp.evaluate(`new Promise((resolve) => {
  const style = document.createElement('style')
  style.id = 'assessment-b-hide-overlays-probe'
  style.textContent = '.impeccable-overlay, .impeccable-label, .impeccable-tooltip { display: none !important; }'
  document.head.appendChild(style)
  requestAnimationFrame(() => requestAnimationFrame(resolve))
})`, true)
const withOverlaysHidden = await measure('after-injection-overlays-hidden')
await cdp.evaluate("document.getElementById('assessment-b-hide-overlays-probe')?.remove()")

const evidence = {
  capturedAt: new Date().toISOString(),
  method: 'headless Chrome CDP; fresh mobile page target, 390 x 844 before navigation',
  targetUrl,
  targetId: target.id,
  detectorUrl,
  injection,
  beforeInjection,
  afterInjection,
  withOverlaysHidden,
  overlayTargets,
  delta: {
    rootScrollWidth: afterInjection.viewport.rootScrollWidth - beforeInjection.viewport.rootScrollWidth,
    bodyScrollWidth: afterInjection.viewport.bodyScrollWidth - beforeInjection.viewport.bodyScrollWidth,
    componentWidth: afterInjection.elements.find((element) => element.selector === '.lx-transfer-panel')?.rect.width
      - beforeInjection.elements.find((element) => element.selector === '.lx-transfer-panel')?.rect.width,
    rootScrollWidthAfterHidingOverlays: withOverlaysHidden.viewport.rootScrollWidth
      - beforeInjection.viewport.rootScrollWidth,
    bodyScrollWidthAfterHidingOverlays: withOverlaysHidden.viewport.bodyScrollWidth
      - beforeInjection.viewport.bodyScrollWidth,
  },
  attribution: withOverlaysHidden.viewport.rootScrollWidth === beforeInjection.viewport.rootScrollWidth
    && withOverlaysHidden.viewport.bodyScrollWidth === beforeInjection.viewport.bodyScrollWidth
    ? 'documentElement scrollWidth returns to its pre-injection value when Impeccable overlay layers are temporarily hidden; the width increase is attributable to overlays, not the component.'
    : 'hiding overlay layers did not fully return root/body scrollWidth to pre-injection values; inspect remaining page overflow separately.',
}
await fs.writeFile(path.join(outputDir, 'mobile-overflow-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
console.log(JSON.stringify(evidence, null, 2))
cdp.socket.close()
