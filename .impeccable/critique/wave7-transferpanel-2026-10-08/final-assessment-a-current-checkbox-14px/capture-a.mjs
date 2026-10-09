import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const outDir = dirname(fileURLToPath(import.meta.url))
const screenshotDir = join(outDir, 'screenshots')
const profileDir = join(outDir, 'browser-profile')
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const targets = [
  ['transferpanel', 'http://127.0.0.1:4174/components/lxtransferpanel.html'],
  ['virtualtree', 'http://127.0.0.1:4174/components/lxvirtualtree.html'],
]
const viewports = [
  ['desktop', 1365, 900, false],
  ['320', 320, 844, true],
  ['375', 375, 812, true],
  ['390', 390, 844, true],
]

class DevTools {
  constructor(socket) {
    this.socket = socket
    this.nextId = 0
    this.pending = new Map()
    this.events = []
    socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data)
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id)
        this.pending.delete(message.id)
        if (message.error) reject(new Error(message.error.message))
        else resolve(message.result)
      } else if (!message.id) {
        this.events.push(message)
      }
    })
  }

  async send(method, params = {}, sessionId) {
    const id = ++this.nextId
    const response = new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }))
    this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
    return response
  }
}

async function waitForPortFile() {
  const file = join(profileDir, 'DevToolsActivePort')
  for (let i = 0; i < 100; i += 1) {
    try {
      return Number((await readFile(file, 'utf8')).split(/\r?\n/)[0])
    } catch {
      await delay(250)
    }
  }
  throw new Error('Chrome DevTools port file was not created')
}

async function openTab(cdp, url) {
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true })
  await cdp.send('Page.enable', {}, sessionId)
  await cdp.send('Runtime.enable', {}, sessionId)
  await cdp.send('Log.enable', {}, sessionId)
  await cdp.send('Network.enable', {}, sessionId)
  const navigation = await cdp.send('Page.navigate', { url }, sessionId)
  let rendered = false
  let pageState
  for (let i = 0; i < 40; i += 1) {
    pageState = await evaluate(cdp, sessionId, `(() => ({
      readyState: document.readyState,
      title: document.title,
      textLength: document.body?.innerText?.trim().length || 0,
      appHtmlLength: document.querySelector('#app')?.innerHTML?.length || 0,
      appText: document.querySelector('#app')?.innerText?.slice(0, 240) || '',
      url: location.href,
    }))()`)
    if (pageState.textLength > 30 || pageState.appHtmlLength > 500) {
      rendered = true
      break
    }
    await delay(300)
  }
  return { targetId, sessionId, navigation, rendered, pageState }
}

async function evaluate(cdp, sessionId, expression) {
  const result = await cdp.send(
    'Runtime.evaluate',
    { expression, returnByValue: true, awaitPromise: true, userGesture: true },
    sessionId,
  )
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || 'Page evaluation failed')
  }
  return result.result.value
}

async function setViewport(cdp, sessionId, width, height, mobile) {
  await cdp.send(
    'Emulation.setDeviceMetricsOverride',
    { width, height, deviceScaleFactor: 1, mobile, screenWidth: width, screenHeight: height },
    sessionId,
  )
  await delay(250)
}

async function capture(cdp, sessionId, fileName) {
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sessionId)
  await writeFile(join(screenshotDir, fileName), Buffer.from(data, 'base64'))
}

const inspectExpression = `(() => {
  const visible = (node) => {
    const rect = node.getBoundingClientRect()
    const style = getComputedStyle(node)
    return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
  }
  const boxes = [...document.querySelectorAll('input[type="checkbox"], .el-checkbox__inner, [role="checkbox"]')]
    .filter(visible)
    .map((box) => {
      const rect = box.getBoundingClientRect()
      const outer = box.closest('.el-checkbox') || box.closest('label') || box.closest('.el-tree-node__content') || box.parentElement
      const hitTarget = box.closest('.el-tree-node__content') || box.closest('.lx-transfer-panel__item') || box.closest('label') || outer
      const hit = hitTarget?.getBoundingClientRect()
      const label = outer?.innerText?.trim() || box.getAttribute('aria-label') || ''
      const style = getComputedStyle(box)
      const ancestors = []
      for (let node = box; node && ancestors.length < 5; node = node.parentElement) {
        const nodeRect = node.getBoundingClientRect()
        const nodeStyle = getComputedStyle(node)
        ancestors.push({
          tag: node.tagName,
          className: typeof node.className === 'string' ? node.className.slice(0, 100) : '',
          width: Math.round(nodeRect.width * 100) / 100,
          height: Math.round(nodeRect.height * 100) / 100,
          padding: nodeStyle.padding,
          cursor: nodeStyle.cursor,
        })
      }
      return {
        label: label.slice(0, 120),
        element: box.tagName,
        visualBox: { width: Math.round(rect.width * 100) / 100, height: Math.round(rect.height * 100) / 100 },
        outerTarget: hit ? { width: Math.round(hit.width * 100) / 100, height: Math.round(hit.height * 100) / 100 } : null,
        ancestors,
        borderRadius: style.borderRadius,
        checked: outer?.classList.contains('is-checked') || box.getAttribute('aria-checked') === 'true',
      }
    })
  const headings = [...document.querySelectorAll('h1, h2, h3')].filter(visible).map((el) => el.innerText.trim()).filter(Boolean)
  const buttons = [...document.querySelectorAll('button, [role="button"]')].filter(visible).map((el) => (el.getAttribute('aria-label') || el.innerText || '').trim()).filter(Boolean)
  const body = document.body.getBoundingClientRect()
  const root = document.documentElement
  const longNodes = [...document.querySelectorAll('label, button, .el-checkbox__label, li, p')]
    .filter(visible)
    .map((el) => ({ text: (el.innerText || '').trim().replace(/\\s+/g, ' ').slice(0, 90), rect: el.getBoundingClientRect() }))
    .filter((item) => item.text.length > 36)
    .slice(0, 12)
    .map((item) => ({ text: item.text, width: Math.round(item.rect.width), height: Math.round(item.rect.height) }))
  return {
    url: location.href,
    title: document.title,
    viewport: { width: innerWidth, height: innerHeight },
    doc: { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth, scrollHeight: root.scrollHeight, bodyWidth: Math.round(body.width) },
    headings,
    buttons: buttons.slice(0, 14),
    checkboxCount: boxes.length,
    checkboxes: boxes.slice(0, 16),
    longNodes,
    theme: {
      rootClass: document.documentElement.className,
      rootDataTheme: document.documentElement.getAttribute('data-theme'),
      bodyClass: document.body.className,
      bodyBackground: getComputedStyle(document.body).backgroundColor,
      htmlBackground: getComputedStyle(document.documentElement).backgroundColor,
      localStorageKeys: Object.keys(localStorage),
    },
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    focused: document.activeElement?.outerHTML?.slice(0, 200) || null,
  }
})()`

await mkdir(screenshotDir, { recursive: true })
await rm(profileDir, { recursive: true, force: true })

const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    `--user-data-dir=${profileDir}`,
    '--remote-debugging-port=0',
    '--remote-allow-origins=*',
    'about:blank',
  ],
  { stdio: 'ignore', windowsHide: true },
)

let socket
try {
  const port = await waitForPortFile()
  const version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()
  socket = new WebSocket(version.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  const cdp = new DevTools(socket)
  const evidence = {
    capturedAt: new Date().toISOString(),
    browser: version.Browser,
    context: 'Fresh Chrome profile launched by this capture script; each target uses a new tab.',
    pages: {},
  }

  for (const [key, url] of targets) {
    const page = await openTab(cdp, url)
    const pageData = {
      url,
      rendering: { rendered: page.rendered, state: page.pageState, navigation: page.navigation },
      viewportChecks: {},
      themes: {},
      interactionChecks: {},
    }
    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] }, page.sessionId)
    const initialTheme = await evaluate(cdp, page.sessionId, `(() => {
      const button = document.querySelector('.VPNavBarAppearance button, .VPSwitchAppearance button')
      const wasDark = document.documentElement.classList.contains('dark')
      if (wasDark && button) button.click()
      return { wasDark, buttonFound: Boolean(button) }
    })()`)
    await delay(400)
    pageData.themes.initialNormalization = initialTheme

    for (const [name, width, height, mobile] of viewports) {
      await setViewport(cdp, page.sessionId, width, height, mobile)
      pageData.viewportChecks[name] = await evaluate(cdp, page.sessionId, inspectExpression)
      await capture(cdp, page.sessionId, `${key}-${name}-light.png`)
    }

    await setViewport(cdp, page.sessionId, 1365, 900, false)
    const darkToggle = await evaluate(cdp, page.sessionId, `(() => {
      const button = document.querySelector('.VPNavBarAppearance button, button[aria-label*="dark" i], button[aria-label*="light" i], button[class*="appearance"]')
      if (!button) return { found: false, buttons: [...document.querySelectorAll('button')].map(b => ({text:b.innerText, label:b.getAttribute('aria-label'), cls:b.className})).slice(0, 20) }
      const before = document.documentElement.className
      button.click()
      return { found: true, before, after: document.documentElement.className, label: button.getAttribute('aria-label'), text: button.innerText }
    })()`)
    pageData.themes.darkToggle = darkToggle
    await delay(400)
    pageData.themes.dark = await evaluate(cdp, page.sessionId, inspectExpression)
    await capture(cdp, page.sessionId, `${key}-desktop-dark.png`)

    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, page.sessionId)
    await setViewport(cdp, page.sessionId, 375, 812, true)
    pageData.interactionChecks.reducedMotion = await evaluate(cdp, page.sessionId, `(() => ({
      active: matchMedia('(prefers-reduced-motion: reduce)').matches,
      component: (() => {
        const root = document.querySelector('.lx-virtual-tree')
        const row = root?.querySelector('.lx-virtual-tree__row')
        const checkbox = root?.querySelector('.lx-virtual-tree__checkbox')
        const describe = (el) => el ? {
          className: typeof el.className === 'string' ? el.className : '',
          transitionDuration: getComputedStyle(el).transitionDuration,
          animationDuration: getComputedStyle(el).animationDuration,
        } : null
        return {
          root: describe(root),
          row: describe(row),
          checkbox: describe(checkbox),
          animations: root?.getAnimations({ subtree: true }).map(a => ({ target: a.effect?.target?.className || a.effect?.target?.tagName || '', playState: a.playState, duration: a.effect?.getTiming().duration })) || [],
        }
      })(),
      focusedTag: document.activeElement?.tagName || null,
      docWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
    }))()`)
    await capture(cdp, page.sessionId, `${key}-375-reduced-motion.png`)

    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] }, page.sessionId)
    const textProbe = await evaluate(cdp, page.sessionId, `(() => {
      const checkbox = [...document.querySelectorAll('input.lx-virtual-tree__checkbox')].find(el => el.getBoundingClientRect().width > 0)
      if (!checkbox) return { found: false }
      const row = checkbox.closest('.lx-virtual-tree__row')
      const walker = document.createTreeWalker(row, NodeFilter.SHOW_TEXT)
      let textNode = walker.nextNode()
      while (textNode && !textNode.nodeValue.trim()) textNode = walker.nextNode()
      if (!textNode) return { found: false, reason: 'Checkbox row has no visible text node' }
      const original = textNode.nodeValue
      textNode.nodeValue = ' 权限对象名称超长验证 Alpha Beta Gamma 0123456789 这段临时文本检查换行、遮挡和横向溢出。'
      window.__codexLongTextProbe = { textNode, original }
      const rect = row.getBoundingClientRect()
      const label = textNode.parentElement
      const labelRect = label.getBoundingClientRect()
      const result = {
        found: true,
        original: original.trim().slice(0, 80),
        rowClass: typeof row.className === 'string' ? row.className : '',
        row: { width: rect.width, height: rect.height, scrollWidth: row.scrollWidth, clientWidth: row.clientWidth },
        label: { width: labelRect.width, height: labelRect.height, scrollWidth: label.scrollWidth, clientWidth: label.clientWidth },
        pageOverflow: document.documentElement.scrollWidth > innerWidth,
      }
      return result
    })()`)
    pageData.interactionChecks.longText = textProbe
    if (textProbe.found) {
      await capture(cdp, page.sessionId, `${key}-375-long-text.png`)
      await evaluate(cdp, page.sessionId, `(() => {
        if (!window.__codexLongTextProbe) return
        window.__codexLongTextProbe.textNode.nodeValue = window.__codexLongTextProbe.original
        delete window.__codexLongTextProbe
      })()`)
    }

    const focusProbe = await evaluate(cdp, page.sessionId, `(() => {
      const tree = document.querySelector('[role="tree"]')
      const focusableRow = tree?.querySelector('.lx-virtual-tree__row[tabindex="0"]')
      const target = focusableRow || tree || [...document.querySelectorAll('input.lx-virtual-tree__checkbox')].reverse().find(el => el.getBoundingClientRect().width > 0)
      if (!target) return { found: false }
      const row = target.closest('.lx-virtual-tree__row') || target
      target.scrollIntoView({ block: 'center' })
      target.focus()
      const rect = target.getBoundingClientRect()
      const rowRect = row.getBoundingClientRect()
      const style = getComputedStyle(target)
      const scrollable = [...document.querySelectorAll('*')].find(el => el.contains(row) && el.scrollHeight > el.clientHeight + 20)
      return {
        found: true,
        target: target.outerHTML.slice(0, 180),
        rowClass: typeof row.className === 'string' ? row.className : '',
        role: target.getAttribute('role'),
        tabIndex: target.tabIndex,
        active: document.activeElement === target,
        visible: rect.top >= 0 && rect.bottom <= innerHeight,
        rect: { top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height },
        rowRect: { top: rowRect.top, bottom: rowRect.bottom, width: rowRect.width, height: rowRect.height },
        scrollContainer: scrollable ? { className: typeof scrollable.className === 'string' ? scrollable.className : '', scrollTop: scrollable.scrollTop, clientHeight: scrollable.clientHeight, scrollHeight: scrollable.scrollHeight } : null,
        outline: style.outline,
        outlineWidth: style.outlineWidth,
        outlineStyle: style.outlineStyle,
        outlineColor: style.outlineColor,
        scrollY,
        scrollHeight: document.documentElement.scrollHeight,
      }
    })()`)
    pageData.interactionChecks.scrollFocus = focusProbe
    await capture(cdp, page.sessionId, `${key}-375-focus.png`)
    pageData.browserErrors = cdp.events
      .filter((event) => ['Runtime.exceptionThrown', 'Log.entryAdded', 'Network.loadingFailed'].includes(event.method))
      .map(({ method, params }) => ({ method, message: params.exceptionDetails?.text || params.entry?.text || params.errorText || params.blockedReason || '' }))

    evidence.pages[key] = pageData
    await cdp.send('Target.closeTarget', { targetId: page.targetId })
  }

  await writeFile(join(outDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')
  process.stdout.write(`${JSON.stringify({ browser: evidence.browser, pages: Object.keys(evidence.pages), screenshotCount: (await import('node:fs/promises')).readdir(screenshotDir).then(files => files.length) })}\n`)
} finally {
  if (socket && socket.readyState === WebSocket.OPEN) socket.close()
  chrome.kill()
  await delay(500)
  await rm(profileDir, { recursive: true, force: true })
}
