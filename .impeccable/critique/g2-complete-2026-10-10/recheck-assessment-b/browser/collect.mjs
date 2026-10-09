import fs from 'node:fs'
import path from 'node:path'

const outDir = path.resolve('.impeccable/critique/g2-complete-2026-10-10/recheck-assessment-b/browser')
fs.mkdirSync(outDir, { recursive: true })
const detectorCode = fs.readFileSync('C:/Users/Administrator/.codex/skills/impeccable/scripts/detector/detect-antipatterns-browser.js', 'utf8')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const targets = await (await fetch('http://127.0.0.1:9222/json/list')).json()
const pageTarget = targets.find((target) => target.type === 'page')
if (!pageTarget?.webSocketDebuggerUrl) throw new Error('No page target available from Chrome CDP')
const ws = new WebSocket(pageTarget.webSocketDebuggerUrl)
let seq = 0
const pending = new Map()
ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    if (msg.error) reject(new Error(msg.error.message))
    else resolve(msg.result)
  }
})
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true })
  ws.addEventListener('error', reject, { once: true })
})
const cdp = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++seq
  pending.set(id, { resolve, reject })
  ws.send(JSON.stringify({ id, method, params }))
})
const evaluate = async (expression, awaitPromise = false) => {
  const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed')
  return result.result?.value
}
const navigate = async (url) => {
  await cdp('Page.navigate', { url })
  await sleep(5000)
}
const setViewport = async (width, height) => {
  await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
  await sleep(250)
}
const setReducedMotion = async (reduce) => {
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }] })
}
const screenshot = async (name) => {
  const result = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  fs.writeFileSync(path.join(outDir, `${name}.png`), Buffer.from(result.data, 'base64'))
  evidence.screenshots.push({ name: `${name}.png`, bytes: Buffer.byteLength(result.data, 'base64') })
}
const injectAndScan = async () => {
  return evaluate(`(() => {
    window.__IMPECCABLE_CONFIG__ = { autoScan: false, visualContrast: false };
    const script = document.createElement('script');
    script.id = 'assessment-b-detector';
    script.textContent = ${JSON.stringify(detectorCode)};
    document.head.appendChild(script);
    return { injected: Boolean(window.impeccableDetect && window.impeccableScan), scriptPresent: Boolean(document.getElementById('assessment-b-detector')) };
  })()`)
}
const scan = async () => evaluate(`(() => {
  const findings = typeof window.impeccableDetect === 'function' ? window.impeccableDetect({ visualContrast: false }) : [];
  if (typeof window.impeccableScan === 'function') window.impeccableScan({ visualContrast: false });
  return { findings, overlayCount: document.querySelectorAll('[class*="impeccable"]').length };
})()`)
const baseMeasure = async (label) => evaluate(`(() => {
  const bodyText = document.body.innerText;
  const switches = [...document.querySelectorAll('[role="switch"],button[aria-checked]')].map((el) => ({
    tag: el.tagName, role: el.getAttribute('role'), ariaChecked: el.getAttribute('aria-checked'), ariaLabel: el.getAttribute('aria-label'), ariaLabelledby: el.getAttribute('aria-labelledby'), ariaBusy: el.getAttribute('aria-busy'), disabled: el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true', text: el.innerText,
  }));
  return { label: ${JSON.stringify(label)}, url: location.href, title: document.title, viewport: { width: innerWidth, height: innerHeight }, scrollWidth: document.documentElement.scrollWidth, bodyScrollWidth: document.body.scrollWidth, bodyTextStart: bodyText.slice(0, 500), bodyHtmlStart: document.body.innerHTML.slice(0, 1000), appText: document.querySelector('#app')?.innerText?.slice(0, 300) || '', switches };
})()`)

const evidence = { generatedAt: new Date().toISOString(), server: 'http://127.0.0.1:4177', pages: {}, overlay: {}, screenshots: [] }
await cdp('Page.enable')
await cdp('Runtime.enable')
await cdp('Emulation.setFocusEmulationEnabled', { enabled: true })

await navigate('http://127.0.0.1:4177/components/lxsearchbar')
evidence.overlay.searchbar = await injectAndScan()
evidence.overlay.searchbarScan = await scan()
await setViewport(1440, 900)
evidence.pages.searchbar1440 = await baseMeasure('searchbar-light-1440')
evidence.pages.searchbar1440.fourField同行 = await evaluate(`(() => {
  const root = document.querySelector('[role="search"]');
  const fields = [...(root?.querySelectorAll('.lx-search-bar__field') || [])].slice(0, 4).map((el) => { const r = el.getBoundingClientRect(); return { text: el.innerText.slice(0, 80), x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) } });
  return { rootFound: Boolean(root), fieldCount: fields.length, fields, rows: [...new Set(fields.map((f) => f.y))].length };
})()`)
await screenshot('searchbar-light-1440')
await setViewport(375, 760)
evidence.pages.searchbar375 = await baseMeasure('searchbar-light-375')
evidence.pages.searchbar375.fourField同行 = await evaluate(`(() => {
  const root = document.querySelector('[role="search"]');
  const buttons = [...(root?.querySelectorAll('button') || [])].map((el) => { const r = el.getBoundingClientRect(); return { text: el.innerText, x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) } });
  return { buttons, scrollWidth: document.documentElement.scrollWidth };
})()`)
await screenshot('searchbar-light-375')

await navigate('http://127.0.0.1:4177/components/lxstatusswitch')
evidence.overlay.statusSwitch = await injectAndScan()
evidence.overlay.statusSwitchScan = await scan()
await setViewport(1440, 900)
evidence.pages.status1440 = await baseMeasure('statusswitch-light-1440')
evidence.pages.status1440.defaultState = await evaluate(`(() => ({ boolean: document.querySelector('[data-testid="boolean-state"]')?.textContent?.trim(), numeric: document.querySelector('[data-testid="numeric-state"]')?.textContent?.trim(), confirm: document.querySelector('[data-testid="confirm-state"]')?.textContent?.trim(), hudClass: document.querySelector('.status-switch-demo')?.className }))()`)
evidence.pages.status1440.ariaLabelledby = await evaluate(`(() => [...document.querySelectorAll('[aria-labelledby]')].map((el) => ({ tag: el.tagName, role: el.getAttribute('role'), labelledby: el.getAttribute('aria-labelledby'), labelText: el.getAttribute('aria-labelledby') ? document.getElementById(el.getAttribute('aria-labelledby'))?.textContent?.trim() : null })).filter((x) => x.role === 'switch' || x.tag === 'BUTTON'))()`)
const confirmClick = await evaluate(`(() => { const row = document.querySelector('[data-testid="confirm-row"]'); const target = row?.querySelector('[role="switch"],button'); if (!target) return { clicked: false }; target.click(); return { clicked: true, tag: target.tagName }; })()`)
await sleep(300)
evidence.pages.status1440.confirmTeleport = await evaluate(`(() => ({ click: ${JSON.stringify(confirmClick)}, dialogs: [...document.querySelectorAll('[role="dialog"],.el-overlay,.el-message-box')].map((el) => ({ tag: el.tagName, role: el.getAttribute('role'), text: el.innerText.slice(0, 240), parent: el.parentElement?.tagName, inBody: el.parentElement === document.body || document.body.contains(el) })), bodyChildren: [...document.body.children].map((el) => el.className).filter(Boolean).slice(-10) }))()`)
await screenshot('statusswitch-confirm-light-1440')
const hudToggle = await evaluate(`(() => { const input = [...document.querySelectorAll('input[type="checkbox"]')].find((el) => el.parentElement?.innerText.includes('HUD')); if (!input) return false; input.click(); return true; })()`)
await sleep(250)
evidence.pages.status1440.hud = { toggled: hudToggle, className: await evaluate(`document.querySelector('.status-switch-demo')?.className`), bodyClass: await evaluate(`document.body.className`) }
await screenshot('statusswitch-hud-1440')
await setViewport(375, 760)
evidence.pages.status375 = await baseMeasure('statusswitch-hud-375')
evidence.pages.status375.touchTargets = await evaluate(`(() => [...document.querySelectorAll('[role="switch"],button,input[type="checkbox"]')].map((el) => { const r = el.getBoundingClientRect(); return { role: el.getAttribute('role'), tag: el.tagName, width: Math.round(r.width), height: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y) } }))()`)
await screenshot('statusswitch-hud-375')
await setReducedMotion(true)
evidence.pages.status375.reducedMotion = await evaluate(`(() => ({ media: matchMedia('(prefers-reduced-motion: reduce)').matches, transitions: [...document.querySelectorAll('[role="switch"],button')].slice(0, 8).map((el) => ({ tag: el.tagName, transitionDuration: getComputedStyle(el).transitionDuration, animationDuration: getComputedStyle(el).animationDuration })) }))()`)
await setReducedMotion(false)

fs.writeFileSync(path.join(outDir, 'evidence.json'), JSON.stringify(evidence, null, 2))
console.log(JSON.stringify(evidence, null, 2))
ws.close()
