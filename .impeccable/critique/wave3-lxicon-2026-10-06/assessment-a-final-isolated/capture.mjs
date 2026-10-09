import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const targetUrl = 'http://127.0.0.1:4174/components/lxicons.html'
const outDir = path.dirname(fileURLToPath(import.meta.url))
const edgePath = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lxicon-assessment-a-'))
const browserProcess = spawn(edgePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--remote-debugging-port=0',
  '--remote-allow-origins=*',
  `--user-data-dir=${profileDir}`,
  'about:blank',
], { stdio: 'ignore', windowsHide: true })

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function waitFor(read, predicate, timeoutMs = 12000) {
  const until = Date.now() + timeoutMs
  while (Date.now() < until) {
    try {
      const value = await read()
      if (predicate(value)) return value
    } catch {}
    await sleep(150)
  }
  throw new Error('Timed out waiting for browser state')
}

function connectCdp(url) {
  const socket = new WebSocket(url)
  const pending = new Map()
  let sequence = 0
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data)
    if (!message.id) return
    const entry = pending.get(message.id)
    if (!entry) return
    pending.delete(message.id)
    if (message.error) entry.reject(new Error(message.error.message))
    else entry.resolve(message.result)
  })
  return new Promise((resolve, reject) => {
    socket.addEventListener('open', () => resolve({
      socket,
      send(method, params = {}) {
        const id = ++sequence
        return new Promise((done, fail) => {
          pending.set(id, { resolve: done, reject: fail })
          socket.send(JSON.stringify({ id, method, params }))
        })
      },
      close() { socket.close() },
    }), { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
}

let browser
let page
const evidence = { target: targetUrl, browser: 'Microsoft Edge headless, isolated temporary profile', captures: [], states: {} }

try {
  const activePortFile = path.join(profileDir, 'DevToolsActivePort')
  await waitFor(() => fs.existsSync(activePortFile) ? fs.readFileSync(activePortFile, 'utf8') : '', (value) => value.length > 0)
  const port = Number(fs.readFileSync(activePortFile, 'utf8').split(/\r?\n/)[0])
  const version = await waitFor(async () => {
    const response = await fetch(`http://127.0.0.1:${port}/json/version`)
    return response.ok ? response.json() : null
  }, Boolean)
  browser = await connectCdp(version.webSocketDebuggerUrl)
  const permission = await browser.send('Browser.grantPermissions', {
    origin: new URL(targetUrl).origin,
    permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
  }).then(() => 'granted').catch((error) => `unavailable: ${error.message}`)
  const created = await browser.send('Target.createTarget', { url: 'about:blank' })
  const target = await waitFor(async () => {
    const response = await fetch(`http://127.0.0.1:${port}/json/list`)
    return (await response.json()).find((item) => item.id === created.targetId)
  }, Boolean)
  page = await connectCdp(target.webSocketDebuggerUrl)
  await page.send('Page.enable')
  await page.send('Runtime.enable')

  const evaluate = async (expression) => {
    const result = await page.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
    return result.result?.value
  }
  const viewport = async (width, height, mobile = false) => {
    await page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile })
    await sleep(450)
  }
  const waitForCatalog = () => waitFor(() => evaluate(`Boolean(document.querySelector('.icon-tile'))`), Boolean)
  const capture = async (name) => {
    const result = await page.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false })
    fs.writeFileSync(path.join(outDir, name), Buffer.from(result.data, 'base64'))
    evidence.captures.push(name)
  }
  const clickSelector = async (selectorExpression) => {
    const bounds = await evaluate(`(() => { const el = ${selectorExpression}; if (!el) return null; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`)
    if (!bounds) throw new Error(`Element missing: ${selectorExpression}`)
    await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: bounds.x, y: bounds.y })
    await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: bounds.x, y: bounds.y, button: 'left', clickCount: 1 })
    await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: bounds.x, y: bounds.y, button: 'left', clickCount: 1 })
    await sleep(350)
  }
  const key = async (name) => {
    const code = name === 'Space' ? 'Space' : name
    const keyValue = name === 'Space' ? ' ' : name
    const virtualKeyCode = name === 'Enter' ? 13 : name === 'Tab' ? 9 : name === 'Space' ? 32 : undefined
    const text = name === 'Space' ? ' ' : undefined
    await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: keyValue, code, windowsVirtualKeyCode: virtualKeyCode, text, unmodifiedText: text })
    await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: keyValue, code, windowsVirtualKeyCode: virtualKeyCode })
    await sleep(250)
  }

  await viewport(1440, 1000)
  await page.send('Page.navigate', { url: targetUrl })
  await waitForCatalog()
  await sleep(700)
  evidence.states.page = await evaluate(`({ title: document.title, viewport: innerWidth, documentWidth: document.documentElement.scrollWidth, tileCount: document.querySelectorAll('.icon-tile').length, groups: [...document.querySelectorAll('.icon-group')].map((el) => ({ title: el.querySelector('summary')?.innerText, open: el.open })), controls: [...document.querySelectorAll('button')].map((el) => ({ text: el.innerText.trim(), label: el.getAttribute('aria-label'), title: el.title, className: el.className })).slice(0, 18) })`)
  await capture('desktop-light.png')

  await clickSelector(`document.querySelector('.VPSwitchAppearance')`)
  await sleep(500)
  evidence.states.hudTheme = await evaluate(`({ rootClass: document.documentElement.className, bodyClass: document.body.className, background: getComputedStyle(document.body).backgroundColor })`)
  await capture('desktop-hud.png')
  await evaluate('window.scrollTo(0, 600)')
  await sleep(300)
  await capture('desktop-hud-sticky.png')
  await clickSelector(`document.querySelector('.VPSwitchAppearance')`)
  await evaluate('window.scrollTo(0, 0)')

  for (const width of [375, 320]) {
    await viewport(width, 812, true)
    await evaluate('window.scrollTo(0, 0)')
    evidence.states[`mobile${width}`] = await evaluate(`({ viewport: innerWidth, documentWidth: document.documentElement.scrollWidth, horizontalOverflow: document.documentElement.scrollWidth > innerWidth, searchWidth: document.querySelector('.icon-searchbar')?.getBoundingClientRect().width, gridWidth: document.querySelector('.icon-grid')?.getBoundingClientRect().width })`)
    await capture(`mobile-${width}-light.png`)
    if (width === 375) {
      await evaluate('window.scrollTo(0, 600)')
      await sleep(300)
      await capture('mobile-375-hud-sticky.png')
      await evaluate('window.scrollTo(0, 0)')
    }
  }

  await viewport(1440, 1000)
  await evaluate('window.scrollTo(0, 0)')
  await clickSelector(`document.querySelector('.icon-search')`)
  await page.send('Input.insertText', { text: '用户' })
  await sleep(350)
  evidence.states.keyboardSearch = await evaluate(`({ value: document.querySelector('.icon-search')?.value, resultText: document.querySelector('.icon-search-status')?.innerText, visibleTiles: document.querySelectorAll('.icon-tile').length, active: document.activeElement?.getAttribute('aria-label') || document.activeElement?.className })`)
  await key('Tab')
  evidence.states.keyboardClearFocus = await evaluate(`({ activeClass: document.activeElement?.className, activeLabel: document.activeElement?.getAttribute('aria-label'), focusVisible: document.activeElement?.matches(':focus-visible') })`)
  await capture('keyboard-search-clear-focus.png')
  await key('Space')
  evidence.states.keyboardClearReturn = await evaluate(`({ value: document.querySelector('.icon-search')?.value, focusedSearch: document.activeElement === document.querySelector('.icon-search'), focusVisible: document.activeElement?.matches(':focus-visible') })`)
  await capture('keyboard-search-clear-return.png')
  if (await evaluate(`Boolean(document.querySelector('.icon-search')?.value)`)) {
    await clickSelector(`document.querySelector('.icon-search__clear')`)
    evidence.states.keyboardClearMouseRecovery = await evaluate(`({ value: document.querySelector('.icon-search')?.value, focusedSearch: document.activeElement === document.querySelector('.icon-search') })`)
  }

  const deleteTile = `document.querySelector('.icon-tile:has(.lx-icon[data-icon-name="delete"])')`
  await clickSelector(deleteTile)
  await sleep(250)
  evidence.states.copySuccess = await evaluate(`(async () => ({ feedback: document.querySelector('.icon-copy-feedback')?.innerText, fallback: Boolean(document.querySelector('.icon-copy-fallback textarea')), clipboard: await navigator.clipboard.readText().catch((error) => 'unavailable: ' + error.name) }))()`)
  await capture('copy-success.png')

  await evaluate(`Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new DOMException('Permission denied', 'NotAllowedError')) } })`)
  await clickSelector(deleteTile)
  await sleep(350)
  evidence.states.copyFailure = await evaluate(`({ feedback: document.querySelector('.icon-copy-feedback')?.innerText, fallback: document.querySelector('.icon-copy-fallback textarea')?.value, focusedFallback: document.activeElement === document.querySelector('.icon-copy-fallback textarea'), selected: document.querySelector('.icon-copy-fallback textarea')?.selectionStart === 0 && document.querySelector('.icon-copy-fallback textarea')?.selectionEnd > 0 })`)
  await capture('copy-failure-manual-fallback.png')

  await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  const deleteIcon = '.lx-icon[data-icon-name="delete"]'
  const deleteBounds = await evaluate(`(() => { const el = ${deleteTile}; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`)
  await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: deleteBounds.x, y: deleteBounds.y })
  evidence.states.reducedMotion = await evaluate(`(() => { const icon = document.querySelector('${deleteIcon}'); const style = getComputedStyle(icon); return { mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches, transitionDuration: style.transitionDuration, animationName: style.animationName, transform: style.transform }; })()`)
  await capture('reduced-motion-hover.png')

  evidence.states.permission = permission
  fs.writeFileSync(path.join(outDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  console.log(JSON.stringify(evidence, null, 2))
} catch (error) {
  evidence.error = error.stack || String(error)
  fs.writeFileSync(path.join(outDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  console.error(error.stack || String(error))
  process.exitCode = 1
} finally {
  page?.close()
  browser?.close()
  browserProcess.kill()
  await sleep(200)
  fs.rmSync(profileDir, { recursive: true, force: true })
}
