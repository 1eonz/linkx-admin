import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const outputDir = path.dirname(fileURLToPath(import.meta.url))
const debugPort = 9223
const pageUrl = 'http://127.0.0.1:4177/components/lxpasswordinput'
const detectorUrl = 'http://127.0.0.1:4178/detect.js'
const edgePath = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const profileDir = path.join(outputDir, 'edge-profile')
const consoleEntries = []
const networkEntries = []
const exceptions = []
const views = []
let browserProcess
let socket
let nextId = 0
const pending = new Map()

await mkdir(profileDir, { recursive: true })

function connectCdp(wsUrl) {
  return new Promise((resolve, reject) => {
    socket = new WebSocket(wsUrl)
    socket.addEventListener('open', () => resolve())
    socket.addEventListener('error', reject)
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)
      if (message.id && pending.has(message.id)) {
        const current = pending.get(message.id)
        pending.delete(message.id)
        if (message.error) current.reject(new Error(`${current.method}: ${message.error.message}`))
        else current.resolve(message.result)
        return
      }

      if (message.method === 'Runtime.consoleAPICalled') {
        const args = message.params.args.map((item) => item.value ?? item.description ?? '')
        consoleEntries.push({ type: message.params.type, args: args.map(String) })
      }
      if (message.method === 'Log.entryAdded') {
        consoleEntries.push({ type: 'log', args: [message.params.entry.text] })
      }
      if (message.method === 'Network.requestWillBeSent') {
        const url = message.params.request.url
        if (url.startsWith('http://127.0.0.1:4177/') || url.startsWith('http://127.0.0.1:4178/')) {
          networkEntries.push({ type: 'request', url, method: message.params.request.method })
        }
      }
      if (message.method === 'Network.responseReceived') {
        const response = message.params.response
        if (response.url.startsWith('http://127.0.0.1:4177/') || response.url.startsWith('http://127.0.0.1:4178/')) {
          networkEntries.push({ type: 'response', url: response.url, status: response.status })
        }
      }
      if (message.method === 'Network.loadingFailed') {
        networkEntries.push({ type: 'failed', error: message.params.errorText })
      }
      if (message.method === 'Runtime.exceptionThrown') {
        exceptions.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text)
      }
    })
  })
}

function cdp(method, params = {}) {
  const id = ++nextId
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, method })
    socket.send(JSON.stringify({ id, method, params }))
  })
}

async function evaluate(expression, awaitPromise = false) {
  const result = await cdp('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
    userGesture: true,
  })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
  return result.result.value
}

async function setViewport(width, height = 960, mobile = false) {
  await cdp('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
  })
  await delay(150)
}

async function screenshot(name, fullPage = false) {
  if (fullPage) {
    const metrics = await cdp('Page.getLayoutMetrics')
    await cdp('Emulation.setDeviceMetricsOverride', {
      width: metrics.cssContentSize.width,
      height: Math.min(metrics.cssContentSize.height, 12000),
      deviceScaleFactor: 1,
      mobile: false,
    })
  }
  const image = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: fullPage })
  await writeFile(path.join(outputDir, name), Buffer.from(image.data, 'base64'))
}

async function click(selector) {
  await evaluate(`document.querySelector(${JSON.stringify(selector)})?.click()`)
  await delay(180)
}

async function key(name, code) {
  const virtualKeyCode = name === 'Enter' ? 13 : name === ' ' ? 32 : 9
  const keyEvent = { key: name, code, windowsVirtualKeyCode: virtualKeyCode, nativeVirtualKeyCode: virtualKeyCode }
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', ...keyEvent })
  if (name === 'Enter' || name === ' ') {
    const text = name === 'Enter' ? '\r' : ' '
    await cdp('Input.dispatchKeyEvent', { type: 'char', ...keyEvent, text, unmodifiedText: text })
  }
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...keyEvent })
  await delay(150)
}

async function recordView(name, extra = {}) {
  const state = await evaluate(`(() => {
    const demo = document.querySelector('.password-input-demo')
    const input = document.querySelector('#password-input-demo')
    const toggle = demo?.querySelector('.lx-password-input__toggle')
    const root = input?.closest('.lx-password-input__focus-root')
    const rect = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }
    }
    const focus = document.activeElement
    return {
      viewport: { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight },
      demo: rect(demo),
      input: rect(input),
      root: rect(root),
      toggle: rect(toggle),
      inputType: input?.type,
      togglePressed: toggle?.getAttribute('aria-pressed'),
      toggleLabel: toggle?.getAttribute('aria-label'),
      focus: focus ? { tag: focus.tagName.toLowerCase(), id: focus.id || '', className: typeof focus.className === 'string' ? focus.className : '' } : null,
      toggleOutline: toggle ? { style: getComputedStyle(toggle).outlineStyle, width: getComputedStyle(toggle).outlineWidth, offset: getComputedStyle(toggle).outlineOffset, transition: getComputedStyle(toggle).transitionDuration } : null,
      overflowX: document.documentElement.scrollWidth > innerWidth,
      overflowY: document.documentElement.scrollHeight > innerHeight,
      readonly: document.querySelector('#password-input-readonly')?.readOnly,
      disabled: document.querySelector('#password-input-disabled')?.disabled,
      hud: demo?.classList.contains('lx-theme-hud'),
      maskOnBlur: [...demo?.querySelectorAll('.password-input-demo__toolbar input[type=checkbox]') || []][2]?.checked,
    }
  })()`)
  views.push({ name, ...state, ...extra })
}

async function waitForPage() {
  for (let attempt = 0; attempt < 60; attempt++) {
    const ready = await evaluate("document.readyState === 'complete' && !!document.querySelector('.password-input-demo')").catch(() => false)
    if (ready) return
    await delay(500)
  }
  throw new Error('文档页或密码输入示例未在 30 秒内就绪')
}

try {
  browserProcess = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    'about:blank',
  ], { stdio: 'ignore', windowsHide: true })

  let version
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      version = await (await fetch(`http://127.0.0.1:${debugPort}/json/version`)).json()
      break
    } catch {
      await delay(250)
    }
  }
  if (!version) throw new Error('Chromium 调试端口未就绪')

  await connectCdp(version.webSocketDebuggerUrl)
  const target = await cdp('Target.createTarget', { url: 'about:blank' })
  const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()
  const page = targets.find((entry) => entry.id === target.targetId)
  if (!page?.webSocketDebuggerUrl) throw new Error('未能创建全新浏览器页')
  socket.close()
  await connectCdp(page.webSocketDebuggerUrl)
  await Promise.all([cdp('Page.enable'), cdp('Runtime.enable'), cdp('Network.enable'), cdp('Log.enable')])
  await setViewport(1440)
  await cdp('Page.navigate', { url: pageUrl })
  await waitForPage()
  await delay(1200)

  await evaluate("document.title = 'LxPasswordInput Assessment B'; document.body.dataset.assessmentPreflight = 'mutable-injection-ready'; true")
  await screenshot('desktop-baseline.png', true)
  await recordView('桌面亮色遮罩默认态（注入前基线）', { screenshot: 'desktop-baseline.png' })
  await setViewport(1440, 960)
  await evaluate(`(() => { const script = document.createElement('script'); script.src = ${JSON.stringify(detectorUrl)}; document.head.appendChild(script); return script.src })()`)
  await delay(2200)
  const injection = await evaluate(`(() => ({
    title: document.title,
    preflight: document.body.dataset.assessmentPreflight,
    detectorLoaded: typeof window.impeccableScan === 'function',
    detectorScript: [...document.scripts].some(script => script.src === ${JSON.stringify(detectorUrl)}),
    overlayCount: document.querySelectorAll('.impeccable-overlay, .impeccable-label, .impeccable-banner').length,
  }))()`)
  const detector = await evaluate(`(() => {
    const findings = window.impeccableDetect?.() || []
    return findings.map(({ selector, tagName, rect, findings: items }) => ({ selector, tagName, rect, findings: items.map(({ type, severity, detail, name }) => ({ type, severity, detail, name })) }))
  })()`)
  await evaluate('window.impeccableScan?.(); true')
  await delay(1200)
  const overlay = await evaluate(`(() => [...document.querySelectorAll('.impeccable-overlay, .impeccable-label, .impeccable-banner')].map(el => ({ tag: el.tagName.toLowerCase(), className: el.className, text: el.textContent?.trim().slice(0, 160), rect: (() => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height } })() })) )()`)
  await screenshot('detector-overlay.png')
  await cdp('Page.navigate', { url: pageUrl })
  await waitForPage()
  await delay(800)
  await setViewport(1440, 960)

  await click('.password-input-demo__toolbar label:nth-child(4) input')
  await evaluate("document.querySelector('#password-input-demo').focus()")
  await key('Tab', 'Tab')
  const focusedToggle = await evaluate(`(() => ({
    activeIsToggle: document.activeElement === document.querySelector('.lx-password-input__toggle'),
    typeBefore: document.querySelector('#password-input-demo').type,
  }))()`)
  await key('Enter', 'Enter')
  const enterVisibility = await evaluate("({ type: document.querySelector('#password-input-demo').type, pressed: document.querySelector('.lx-password-input__toggle').getAttribute('aria-pressed') })")
  await key('Tab', 'Tab')
  const maskReturn = await evaluate("({ type: document.querySelector('#password-input-demo').type, focusId: document.activeElement.id, activeClass: typeof document.activeElement.className === 'string' ? document.activeElement.className : '' })")
  await screenshot('desktop-light-mask-on-blur.png')
  await recordView('maskOnBlur 开启：离开组件后恢复遮罩', { focusedToggle, enterVisibility, maskReturn, screenshot: 'desktop-light-mask-on-blur.png' })
  await click('.password-input-demo__toolbar label:nth-child(4) input')
  await evaluate("document.querySelector('#password-input-demo').focus()")
  await key('Tab', 'Tab')
  await key('Enter', 'Enter')
  await key('Tab', 'Tab')
  const maskOffLeave = await evaluate("({ type: document.querySelector('#password-input-demo').type, focusId: document.activeElement.id })")
  await screenshot('desktop-light-plain.png')
  await recordView('maskOnBlur 关闭：离开组件后保持明文', { maskOffLeave, screenshot: 'desktop-light-plain.png' })

  await click('.password-input-demo__advanced summary')
  await click('.password-input-demo__advanced-controls label:nth-child(2) input')
  await screenshot('desktop-hud.png')
  await recordView('HUD 深色主题', { screenshot: 'desktop-hud.png' })

  await click('.lx-password-input__toggle')
  await evaluate("document.querySelector('#password-input-demo').focus()")
  await key('Tab', 'Tab')
  await screenshot('keyboard-focus-visible.png')
  const keyboardFocus = await evaluate(`(() => ({
    activeIsToggle: document.activeElement === document.querySelector('.lx-password-input__toggle'),
    outline: getComputedStyle(document.querySelector('.lx-password-input__toggle')).outlineStyle,
    outlineWidth: getComputedStyle(document.querySelector('.lx-password-input__toggle')).outlineWidth,
  }))()`)
  await recordView('键盘焦点路径与显隐按钮可达性', { keyboardFocus, screenshot: 'keyboard-focus-visible.png' })

  await click('.lx-password-input__toggle')
  await setViewport(375, 812, true)
  await evaluate("window.scrollTo(0, document.querySelector('.password-input-demo').getBoundingClientRect().top + scrollY)")
  await screenshot('mobile-375.png')
  await recordView('375px 移动视口 HUD 遮罩', { screenshot: 'mobile-375.png' })
  await setViewport(320, 740, true)
  await screenshot('mobile-320.png')
  await recordView('320px 移动视口 HUD 遮罩', { screenshot: 'mobile-320.png' })

  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await delay(150)
  const reducedMotion = await evaluate(`(() => ({ mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches, toggleTransition: getComputedStyle(document.querySelector('.lx-password-input__toggle')).transitionDuration, demoScrollBehavior: getComputedStyle(document.querySelector('.password-input-demo')).scrollBehavior }))()`)
  await screenshot('mobile-320-reduced-motion.png')
  await recordView('320px 减少动效偏好', { reducedMotion, screenshot: 'mobile-320-reduced-motion.png' })

  const interactionBase = await evaluate(`(() => {
    const input = document.querySelector('#password-input-demo')
    const toggle = document.querySelector('.lx-password-input__toggle')
    const readOnly = document.querySelector('#password-input-readonly')
    const disabled = document.querySelector('#password-input-disabled')
    const result = { initialType: input.type, toggleName: toggle.getAttribute('aria-label'), togglePressed: toggle.getAttribute('aria-pressed') }
    result.touchTarget = (() => { const r = toggle.getBoundingClientRect(); return { width: r.width, height: r.height } })()
    readOnly.focus()
    result.readonlyFocusable = document.activeElement === readOnly
    disabled.focus()
    result.disabledSkippedFocus = document.activeElement !== disabled
    return result
  })()`)
  await evaluate("document.querySelector('.lx-password-input__toggle').focus()")
  await key(' ', 'Space')
  const spaceToggleType = await evaluate("document.querySelector('#password-input-demo').type")
  const interaction = { ...interactionBase, spaceToggleType }
  await recordView('只读禁用与 Space 键、触控目标', { interaction })

  await writeFile(path.join(outputDir, 'browser-evidence.json'), JSON.stringify({
    pageUrl,
    detectorUrl,
    browser: 'Microsoft Edge headless via DevTools Protocol',
    injection,
    detector,
    overlay,
    views,
    interaction,
    reducedMotion,
    console: consoleEntries,
    network: networkEntries,
    exceptions,
  }, null, 2) + '\n')
  process.stdout.write(JSON.stringify({ injection, detectorFindingGroups: detector.length, overlayCount: overlay.length, views: views.length, exceptions: exceptions.length }) + '\n')
} finally {
  try { socket?.close() } catch {}
  if (browserProcess?.pid) {
    browserProcess.kill()
    await delay(500)
  }
}
