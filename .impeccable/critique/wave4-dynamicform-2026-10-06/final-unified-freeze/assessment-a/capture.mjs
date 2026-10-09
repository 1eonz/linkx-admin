import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const outputDir = path.resolve('.impeccable/critique/wave4-dynamicform-2026-10-06/final-unified-freeze/assessment-a')
const browserPath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const profileDir = path.join(tmpdir(), `linkx-assessment-a-${process.pid}`)
const fixturePath = path.join(profileDir, '重试-任务封面.png')
const url = 'http://127.0.0.1:4174/components/lxdynamicform.html'
const browser = spawn(browserPath, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--no-sandbox',
  '--remote-debugging-port=0',
  `--user-data-dir=${profileDir}`,
], { stdio: 'ignore', windowsHide: true })

class CdpClient {
  nextId = 1
  pending = new Map()
  socket

  constructor(endpoint) {
    this.socket = new WebSocket(endpoint)
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data))
      if (!message.id) return
      const request = this.pending.get(message.id)
      if (!request) return
      this.pending.delete(message.id)
      if (message.error) request.reject(new Error(message.error.message))
      else request.resolve(message.result)
    })
  }

  ready() {
    if (this.socket.readyState === WebSocket.OPEN) return Promise.resolve()
    return new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true })
      this.socket.addEventListener('error', reject, { once: true })
    })
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      const message = { id, method, params }
      if (sessionId) message.sessionId = sessionId
      this.socket.send(JSON.stringify(message))
    })
  }

  close() {
    this.socket.close()
  }
}

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function waitForFile(filePath, timeoutMs) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    if (existsSync(filePath)) return
    await pause(50)
  }
  throw new Error(`Timed out waiting for ${filePath}`)
}

let client
let contextId
let sessionId
const evidence = {
  target: url,
  browser: 'Google Chrome headless, isolated temporary profile and CDP browser context',
  captures: [],
  interactions: [],
  observations: {},
}

try {
  mkdirSync(outputDir, { recursive: true })
  await waitForFile(path.join(profileDir, 'DevToolsActivePort'), 15000)
  const [port] = readFileSync(path.join(profileDir, 'DevToolsActivePort'), 'utf8').trim().split(/\r?\n/)
  const version = await fetch(`http://127.0.0.1:${port}/json/version`).then((response) => response.json())
  client = new CdpClient(version.webSocketDebuggerUrl)
  await client.ready()
  const context = await client.send('Target.createBrowserContext', { disposeOnDetach: true })
  contextId = context.browserContextId
  const target = await client.send('Target.createTarget', { url: 'about:blank', browserContextId: contextId })
  const attached = await client.send('Target.attachToTarget', { targetId: target.targetId, flatten: true })
  sessionId = attached.sessionId

  const command = (method, params = {}) => client.send(method, params, sessionId)
  const evaluate = async (expression) => {
    const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
    return result.result?.value
  }
  const setViewport = async ({ width, height, mobile, touch }) => {
    await command('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: mobile ? 2 : 1,
      mobile,
    })
    await command('Emulation.setTouchEmulationEnabled', touch ? { enabled: true, maxTouchPoints: 1 } : { enabled: false })
    await command('Emulation.setEmulatedMedia', {
      features: [
        { name: 'hover', value: touch ? 'none' : 'hover' },
        { name: 'pointer', value: touch ? 'coarse' : 'fine' },
        { name: 'prefers-reduced-motion', value: 'reduce' },
      ],
    })
  }
  const navigate = async () => {
    await command('Page.navigate', { url })
    const started = Date.now()
    while (Date.now() - started < 12000) {
      const ready = await evaluate("document.readyState === 'complete' && !!document.querySelector('.lx-dynamic-form')")
      if (ready) return
      await pause(100)
    }
    throw new Error(`Target did not render the dynamic form: ${url}`)
  }
  const capture = async (name) => {
    const result = await command('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false })
    writeFileSync(path.join(outputDir, name), Buffer.from(result.data, 'base64'))
    evidence.captures.push(name)
  }
  const clickText = async (selector, text) => evaluate(`(() => { const nodes = [...document.querySelectorAll(${JSON.stringify(selector)})]; const node = nodes.find((item) => item.innerText.trim() === ${JSON.stringify(text)} || item.textContent.trim() === ${JSON.stringify(text)}); if (!node) return false; node.click(); return true; })()`)

  await command('Page.enable')
  await command('Runtime.enable')
  await setViewport({ width: 1440, height: 1000, mobile: false, touch: false })
  await navigate()
  evidence.observations.desktopInitial = await evaluate(`(() => {
    const rect = (selector) => { const element = document.querySelector(selector); if (!element) return null; const box = element.getBoundingClientRect(); return { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) }; };
    return {
      title: document.title,
      headings: [...document.querySelectorAll('h1,h2,h3')].map((item) => item.innerText.trim()).filter(Boolean).slice(0, 20),
      viewport: { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight },
      nav: rect('.VPNav'), sidebar: rect('.VPSidebar'), doc: rect('.VPDoc'), demo: rect('.dynamic-form-demo'), form: rect('.lx-dynamic-form'),
      fields: [...document.querySelectorAll('.lx-dynamic-form__item')].map((item) => ({ label: item.querySelector('.el-form-item__label')?.innerText.trim(), rect: (() => { const r = item.getBoundingClientRect(); return {x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height)} })() })),
      text: document.body.innerText.slice(0, 5000),
      buttons: [...document.querySelectorAll('button')].map((item) => item.innerText.trim() || item.getAttribute('aria-label')).filter(Boolean).slice(0, 40),
    };
  })()`)
  await capture('desktop-page.png')
  await evaluate("document.querySelector('.dynamic-form-demo')?.scrollIntoView({ block: 'start' })")
  await pause(300)
  await capture('desktop-form.png')

  evidence.interactions.push({ name: '打开低频设置与提交空表单', settingsOpened: await clickText('summary', '演示设置') })
  const submitClicked = await clickText('button', '提交校验')
  evidence.interactions.push({ name: '提交空表单', submitClicked })
  await pause(250)
  evidence.observations.validationError = await evaluate(`(() => ({ errors: [...document.querySelectorAll('.el-form-item__error')].map((item) => item.innerText.trim()), focused: document.activeElement?.getAttribute('placeholder'), invalidCount: document.querySelectorAll('[aria-invalid="true"]').length }))()`)
  await capture('desktop-validation-error.png')

  evidence.interactions.push({ name: '切换远程候选为失败', selected: await clickText('label', '失败') })
  await pause(800)
  evidence.observations.remoteFailure = await evaluate(`(() => ({ feedback: [...document.querySelectorAll('.lx-dynamic-form__feedback')].map((item) => item.innerText.trim()), retryButtons: [...document.querySelectorAll('button')].filter((item) => item.innerText.trim() === '重试').length }))()`)
  await capture('desktop-remote-failure.png')

  const themeClicked = await clickText('label', 'HUD 深色主题')
  evidence.interactions.push({ name: '切换 HUD 深色主题', themeClicked })
  await pause(200)
  evidence.observations.hud = await evaluate(`(() => ({ dark: document.documentElement.classList.contains('dark'), hud: document.documentElement.classList.contains('lx-theme-hud'), background: getComputedStyle(document.body).backgroundColor }))()`)
  await capture('desktop-hud.png')

  const fixture = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pS8AAAAASUVORK5CYII=', 'base64')
  mkdirSync(profileDir, { recursive: true })
  writeFileSync(fixturePath, fixture)
  const fileNode = await command('DOM.getDocument', { depth: -1, pierce: true }).then((result) => client.send('DOM.querySelector', { nodeId: result.root.nodeId, selector: '.lx-dynamic-form .lx-upload input[type="file"]' }, sessionId))
  evidence.interactions.push({ name: '选择重试-任务封面.png（本地 Mock 上传）', foundFileInput: fileNode.nodeId > 0 })
  if (fileNode.nodeId > 0) {
    await command('DOM.setFileInputFiles', { nodeId: fileNode.nodeId, files: [fixturePath] })
    await pause(120)
    await capture('desktop-upload-progress.png')
    await pause(1000)
    evidence.observations.uploadFailure = await evaluate(`(() => ({ statuses: [...document.querySelectorAll('.lx-upload__file-status')].map((item) => item.innerText.trim()), errors: [...document.querySelectorAll('.lx-upload__file-error')].map((item) => item.innerText.trim()), filenames: [...document.querySelectorAll('.lx-upload__file-name')].map((item) => item.innerText.trim()) }))()`)
    await capture('desktop-upload-failure.png')
    const retried = await clickText('.lx-upload__retry', '重试')
    evidence.interactions.push({ name: '重试失败上传', retried })
    await pause(1100)
    evidence.observations.uploadSuccess = await evaluate(`(() => ({ statuses: [...document.querySelectorAll('.lx-upload__file-status')].map((item) => item.innerText.trim()), filenames: [...document.querySelectorAll('.lx-upload__file-name')].map((item) => item.innerText.trim()) }))()`)
    await capture('desktop-upload-success.png')
  }

  await setViewport({ width: 375, height: 812, mobile: true, touch: true })
  await navigate()
  await evaluate("document.querySelector('.dynamic-form-demo')?.scrollIntoView({ block: 'start' })")
  await pause(350)
  evidence.observations.mobile = await evaluate(`(() => {
    const selectors = ['.VPNav', '.VPSidebar', '.VPDoc', '.dynamic-form-demo', '.lx-dynamic-form', '.lx-dynamic-form__item', '.lx-upload', '.dynamic-form-demo__footer'];
    const boxes = Object.fromEntries(selectors.map((selector) => { const element = document.querySelector(selector); if (!element) return [selector, null]; const r = element.getBoundingClientRect(); return [selector, {x: Math.round(r.x), y: Math.round(r.y), right: Math.round(r.right), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height)}] }));
    const summaries = [...document.querySelectorAll('summary')].map((element) => ({ text: element.innerText.trim(), box: (() => { const r = element.getBoundingClientRect(); return {width: Math.round(r.width), height: Math.round(r.height), y: Math.round(r.y)} })() }));
    return { viewport: {width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight}, media: {hoverNone: matchMedia('(hover: none)').matches, pointerCoarse: matchMedia('(pointer: coarse)').matches, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches}, boxes, summaries, text: document.querySelector('.dynamic-form-demo')?.innerText.slice(0, 3000) };
  })()`)
  await capture('mobile-form.png')

  evidence.interactions.push({ name: '展开字段类型预览', opened: await clickText('summary', '字段类型预览') })
  const selectClicked = await evaluate("(() => { const element = document.querySelector('.dynamic-form-demo__schema-preview .el-select__wrapper'); if (!element) return false; element.click(); return true; })()")
  await pause(150)
  evidence.interactions.push({ name: '打开字段类型选择器', opened: selectClicked })
  evidence.interactions.push({ name: '选择日期范围字段', selected: await clickText('[role="option"]', '日期范围') })
  await pause(250)
  const startClicked = await evaluate("(() => { const input = document.querySelector('.dynamic-form-demo__schema-preview .el-range-input'); if (!input) return false; input.click(); return true; })()")
  evidence.interactions.push({ name: '打开窄屏日期范围日历', opened: startClicked })
  await pause(300)
  evidence.observations.mobileDateRange = await evaluate(`(() => {
    const popper = document.querySelector('.lx-date-picker__popper[aria-hidden="false"]');
    if (!popper) return { visible: false };
    const r = popper.getBoundingClientRect();
    return { visible: true, box: {x: Math.round(r.x), y: Math.round(r.y), right: Math.round(r.right), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height)}, viewport: {width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth}, visiblePanels: [...popper.querySelectorAll('.el-date-range-picker__content')].filter((item) => item.getClientRects().length > 0).length, shortcuts: [...popper.querySelectorAll('button')].map((item) => item.innerText.trim()).filter(Boolean).slice(0, 8) };
  })()`)
  await capture('mobile-date-range-picker.png')

  console.log(JSON.stringify({ captures: evidence.captures, observations: evidence.observations, interactions: evidence.interactions }, null, 2))
} catch (error) {
  evidence.error = String(error?.stack ?? error)
  console.error(evidence.error)
  process.exitCode = 1
} finally {
  try {
    if (contextId && client) await client.send('Target.disposeBrowserContext', { browserContextId: contextId })
  } catch {}
  try {
    client?.close()
    browser.kill()
  } catch {}
  await pause(250)
  rmSync(profileDir, { recursive: true, force: true })
}
