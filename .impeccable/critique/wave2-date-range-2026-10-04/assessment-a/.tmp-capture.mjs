import { spawn } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import net from 'node:net'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const outputDir = path.resolve(process.argv[2])
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const baseUrl = 'http://127.0.0.1:5179/components/lxdatepicker'
const profilePath = path.join(process.env.TEMP || 'C:\\Temp', `lxdatepicker-assessment-a-${process.pid}`)

const portServer = net.createServer()
await new Promise((resolve, reject) => {
  portServer.once('error', reject)
  portServer.listen(0, '127.0.0.1', resolve)
})
const port = portServer.address().port
await new Promise((resolve, reject) => portServer.close(error => error ? reject(error) : resolve()))

await mkdir(outputDir, { recursive: true })
const browser = spawn(edgePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profilePath}`,
  '--window-size=1280,720',
  baseUrl,
], { stdio: 'ignore' })

let ws
try {
  let version
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      version = await fetch(`http://127.0.0.1:${port}/json/version`).then(response => response.json())
      break
    } catch {
      if (browser.exitCode !== null) throw new Error('Edge exited before remote debugging became available')
      await delay(250)
    }
  }
  if (!version) throw new Error('Timed out waiting for Edge remote debugging')

  const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(response => response.json())
  const target = targets.find(item => item.type === 'page' && item.url.startsWith(baseUrl))
  if (!target?.webSocketDebuggerUrl) throw new Error('Could not locate the target Edge page')

  ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true })
    ws.addEventListener('error', reject, { once: true })
  })

  let nextId = 0
  const pending = new Map()
  ws.addEventListener('message', event => {
    const message = JSON.parse(String(event.data))
    if (!message.id) return
    const request = pending.get(message.id)
    if (!request) return
    pending.delete(message.id)
    if (message.error) request.reject(new Error(message.error.message))
    else request.resolve(message.result)
  })

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
  const evaluate = async expression => {
    const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || 'Page evaluation failed')
    return response.result.value
  }
  const waitForPage = async () => {
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const ready = await evaluate('document.readyState === "complete"')
      if (ready) break
      await delay(100)
    }
    await delay(500)
  }
  const setViewport = async (width, height, mobile) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
    })
  }
  const reload = async () => {
    await send('Page.reload', { ignoreCache: true })
    await waitForPage()
  }
  const capture = async (name, state) => {
    const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
    await writeFile(path.join(outputDir, `${name}.png`), Buffer.from(result.data, 'base64'))
    return state
  }
  const geometry = () => evaluate(`(() => {
    const popper = [...document.querySelectorAll('.lx-date-picker__popper')].find(item => item.getAttribute('aria-hidden') === 'false')
    const rect = element => {
      if (!element) return null
      const value = element.getBoundingClientRect()
      return { left: value.left, top: value.top, right: value.right, bottom: value.bottom, width: value.width, height: value.height }
    }
    const lastRow = popper && [...popper.querySelectorAll('.el-date-table tr')].at(-1)
    const sidebar = popper?.querySelector('.el-picker-panel__sidebar')
    const style = popper && getComputedStyle(popper)
    return {
      viewport: { width: innerWidth, height: innerHeight },
      document: { scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight },
      windowScrollY: scrollY,
      popper: popper ? {
        className: popper.className,
        ariaHidden: popper.getAttribute('aria-hidden'),
        rect: rect(popper),
        maxHeight: style.maxHeight,
        overflowY: style.overflowY,
        scrollTop: popper.scrollTop,
        scrollHeight: popper.scrollHeight,
        clientHeight: popper.clientHeight,
        sidebarText: sidebar?.innerText ?? null,
        shortcutCount: sidebar?.querySelectorAll('.el-picker-panel__shortcut').length ?? 0,
        lastRow: rect(lastRow),
      } : null,
    }
  })()`)

  await send('Page.enable')
  await send('Runtime.enable')
  await waitForPage()

  const results = {}
  await setViewport(1280, 720, false)
  await reload()
  results.desktopDefault = await geometry()
  await capture('01-desktop-default', results.desktopDefault)
  await evaluate('document.querySelector("#demo-date-control-start").click()')
  await delay(350)
  results.desktopRangeOpen = await geometry()
  await capture('02-desktop-range-open', results.desktopRangeOpen)

  await setViewport(375, 812, true)
  await reload()
  await evaluate('document.querySelector("#demo-date-analysis-start").click()')
  await delay(500)
  results.mobile375Open = await geometry()
  await capture('03-mobile-375x812-open', results.mobile375Open)

  await setViewport(390, 375, true)
  await reload()
  await evaluate('document.querySelector("#demo-date-analysis-start").click()')
  await delay(500)
  results.mobile390Open = await geometry()
  await capture('04-mobile-390x375-open', results.mobile390Open)
  await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 150, y: 300, deltaX: 0, deltaY: 375 })
  await delay(500)
  results.mobile390AfterWheel = await geometry()
  await capture('05-mobile-390x375-after-wheel', results.mobile390AfterWheel)

  await writeFile(path.join(outputDir, 'measurements.json'), `${JSON.stringify(results, null, 2)}\n`)
  process.stdout.write(JSON.stringify(results, null, 2))
} finally {
  try { ws?.close() } catch {}
  browser.kill()
  await delay(300)
  await rm(profilePath, { recursive: true, force: true })
}
