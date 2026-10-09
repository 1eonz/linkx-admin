import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const outputDir = process.argv[4] ? path.resolve(process.argv[4]) : scriptDir
const screenshotsDir = path.join(outputDir, 'screenshots')
const repoRoot = path.resolve(scriptDir, '..', '..', '..', '..')
const packageRoot = path.join(repoRoot, 'linkx-fe')
const target = path.join(
  packageRoot,
  'src',
  'components',
  'LxTransferPanel',
  'index.vue'
)
const chromePath = process.argv[2]
const liveServerScript = process.argv[3]
const scenarioFilter = process.argv[5] ?? null
const previewUrl = 'http://127.0.0.1:4199/components/lxtransferpanel'
const detectorPort = 8401
const debugPort = 9333
const detectorUrl = `http://127.0.0.1:${detectorPort}/detect.js`
const expectedHash =
  '707ea027e7c450226c68f07cec01df5730e7cb3b52270859c7389ec5a773cedc'
const hashFile = (filePath) =>
  createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

if (!chromePath || !liveServerScript) {
  throw new Error('Pass absolute Chrome and live-server.mjs paths')
}

fs.mkdirSync(screenshotsDir, { recursive: true })

class CdpClient {
  constructor(socket) {
    this.socket = socket
    this.nextId = 1
    this.pending = new Map()
    this.listeners = new Map()
    socket.addEventListener('message', (event) =>
      this.onMessage(String(event.data))
    )
  }

  on(method, sessionId, listener) {
    const key = `${sessionId ?? ''}:${method}`
    const listeners = this.listeners.get(key) ?? []
    listeners.push(listener)
    this.listeners.set(key, listeners)
  }

  onMessage(raw) {
    let message
    try {
      message = JSON.parse(raw)
    } catch {
      return
    }
    if (message.id) {
      const pending = this.pending.get(message.id)
      if (!pending) return
      this.pending.delete(message.id)
      if (message.error) pending.reject(new Error(message.error.message))
      else pending.resolve(message.result ?? {})
      return
    }
    const key = `${message.sessionId ?? ''}:${message.method}`
    for (const listener of this.listeners.get(key) ?? []) {
      listener(message.params ?? {})
    }
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++
    const payload = { id, method, params }
    if (sessionId) payload.sessionId = sessionId
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`CDP timeout: ${method}`))
      }, 15000)
      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timeout)
          resolve(value)
        },
        reject: (error) => {
          clearTimeout(timeout)
          reject(error)
        },
      })
      this.socket.send(JSON.stringify(payload))
    })
  }
}

function consoleText(params) {
  return (params.args ?? [])
    .map((arg) => arg.value ?? arg.description ?? arg.type ?? '')
    .join(' ')
}

function keySpec(name) {
  const keys = {
    Tab: { key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 },
    Enter: { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 },
    Space: {
      key: ' ',
      code: 'Space',
      text: ' ',
      unmodifiedText: ' ',
      windowsVirtualKeyCode: 32,
    },
  }
  return keys[name]
}

async function dispatchKey(cdp, sessionId, name) {
  const spec = keySpec(name)
  await cdp.send(
    'Input.dispatchKeyEvent',
    {
      ...spec,
      type: 'keyDown',
      nativeVirtualKeyCode: spec.windowsVirtualKeyCode,
    },
    sessionId
  )
  await cdp.send(
    'Input.dispatchKeyEvent',
    {
      ...spec,
      type: 'keyUp',
      nativeVirtualKeyCode: spec.windowsVirtualKeyCode,
    },
    sessionId
  )
  await delay(80)
}

async function evaluate(cdp, sessionId, expression) {
  const result = await cdp.send(
    'Runtime.evaluate',
    { expression, returnByValue: true, awaitPromise: true, userGesture: true },
    sessionId
  )
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? 'Runtime.evaluate failed')
  }
  return result.result?.value
}

async function waitForValue(cdp, sessionId, expression, timeout = 20000) {
  const end = Date.now() + timeout
  while (Date.now() < end) {
    const value = await evaluate(cdp, sessionId, expression)
    if (value) return value
    await delay(100)
  }
  throw new Error(`Timed out waiting for browser condition: ${expression}`)
}

async function pointerClick(cdp, sessionId, expression) {
  const point = await evaluate(
    cdp,
    sessionId,
    `(() => {
      const el = ${expression}
      if (!(el instanceof Element)) return null
      el.scrollIntoView({ block: 'center', inline: 'nearest' })
      const r = el.getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, width: r.width, height: r.height }
    })()`
  )
  if (!point || point.width <= 0 || point.height <= 0) return false
  await cdp.send(
    'Input.dispatchMouseEvent',
    { type: 'mouseMoved', x: point.x, y: point.y },
    sessionId
  )
  await cdp.send(
    'Input.dispatchMouseEvent',
    {
      type: 'mousePressed',
      x: point.x,
      y: point.y,
      button: 'left',
      buttons: 1,
      clickCount: 1,
    },
    sessionId
  )
  await cdp.send(
    'Input.dispatchMouseEvent',
    {
      type: 'mouseReleased',
      x: point.x,
      y: point.y,
      button: 'left',
      buttons: 0,
      clickCount: 1,
    },
    sessionId
  )
  await delay(200)
  return true
}

async function tabTo(cdp, sessionId, selector, limit = 260) {
  const encoded = JSON.stringify(selector)
  for (let step = 0; step <= limit; step += 1) {
    const focused = await evaluate(
      cdp,
      sessionId,
      `document.activeElement === document.querySelector(${encoded})`
    )
    if (focused) return { found: true, steps: step }
    await dispatchKey(cdp, sessionId, 'Tab')
  }
  return { found: false, steps: limit }
}

async function focusElement(cdp, sessionId, selector) {
  return evaluate(
    cdp,
    sessionId,
    `(() => { const el = document.querySelector(${JSON.stringify(
      selector
    )}); if (!el) return false; el.focus(); return true })()`
  )
}

async function tabToExpression(cdp, sessionId, expression, limit = 260) {
  for (let step = 0; step <= limit; step += 1) {
    const focused = await evaluate(
      cdp,
      sessionId,
      `document.activeElement === (${expression})`
    )
    if (focused) return { found: true, steps: step }
    await dispatchKey(cdp, sessionId, 'Tab')
  }
  return { found: false, steps: limit }
}

async function pressKeyOnSelector(cdp, sessionId, selector, key) {
  const tabResult = await tabTo(cdp, sessionId, selector)
  let focusMethod = 'tab'
  if (!tabResult.found) {
    await focusElement(cdp, sessionId, selector)
    focusMethod = 'programmatic focus fallback'
  }
  const focusedState = await evaluate(
    cdp,
    sessionId,
    `(() => { const el = document.querySelector(${JSON.stringify(
      selector
    )}); return { active: document.activeElement === el, focusVisible: !!el?.matches(':focus-visible') } })()`
  )
  await dispatchKey(cdp, sessionId, key)
  return { tabResult, focusMethod, focusedState }
}

async function newPage(cdp, config, evidence) {
  const { browserContextId } = await cdp.send('Target.createBrowserContext', {
    disposeOnDetach: true,
  })
  const { targetId } = await cdp.send('Target.createTarget', {
    url: 'about:blank',
    browserContextId,
  })
  const { sessionId } = await cdp.send('Target.attachToTarget', {
    targetId,
    flatten: true,
  })

  cdp.on('Runtime.consoleAPICalled', sessionId, (params) => {
    const entry = {
      type: params.type,
      text: consoleText(params),
      timestamp: params.timestamp,
    }
    evidence.console.push(entry)
    evidence.allConsole.push({ scenario: config.name, ...entry })
  })
  cdp.on('Runtime.exceptionThrown', sessionId, (params) => {
    const entry = {
      text: params.exceptionDetails?.text ?? 'Runtime exception',
      url: params.exceptionDetails?.url ?? null,
      lineNumber: params.exceptionDetails?.lineNumber ?? null,
    }
    evidence.exceptions.push(entry)
  })
  cdp.on('Network.requestWillBeSent', sessionId, (params) => {
    evidence.requests.push({
      url: params.request.url,
      method: params.request.method,
    })
  })
  cdp.on('Network.responseReceived', sessionId, (params) => {
    if (params.response.status >= 400) {
      evidence.httpFailures.push({
        url: params.response.url,
        status: params.response.status,
      })
    }
  })

  await cdp.send('Page.enable', {}, sessionId)
  await cdp.send('Runtime.enable', {}, sessionId)
  await cdp.send('Network.enable', {}, sessionId)
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true }, sessionId)
  await cdp.send(
    'Emulation.setDeviceMetricsOverride',
    {
      width: config.width,
      height: config.height,
      deviceScaleFactor: 1,
      mobile: config.mobile,
      screenWidth: config.width,
      screenHeight: config.height,
    },
    sessionId
  )
  await cdp.send(
    'Emulation.setEmulatedMedia',
    {
      media: 'screen',
      features: [
        { name: 'prefers-color-scheme', value: config.colorScheme },
        { name: 'prefers-reduced-motion', value: config.reducedMotion },
      ],
    },
    sessionId
  )
  await cdp.send('Page.navigate', { url: previewUrl }, sessionId)
  await waitForValue(
    cdp,
    sessionId,
    `document.readyState === 'complete' && !!document.querySelector('.transfer-panel-demo__preview .lx-transfer-panel')`,
    45000
  )
  await delay(500)
  return { browserContextId, targetId, sessionId }
}

async function screenshot(cdp, sessionId, filename) {
  const captured = await cdp.send(
    'Page.captureScreenshot',
    { format: 'png', fromSurface: true, captureBeyondViewport: false },
    sessionId
  )
  const file = path.join(screenshotsDir, filename)
  fs.writeFileSync(file, Buffer.from(captured.data, 'base64'))
  return path.relative(outputDir, file).replaceAll(path.sep, '/')
}

async function metrics(cdp, sessionId) {
  return evaluate(
    cdp,
    sessionId,
    `(() => {
      const root = document.querySelector('.lx-transfer-panel')
      const preview = document.querySelector('.transfer-panel-demo__preview')
      const rect = (el) => {
        if (!el) return null
        const r = el.getBoundingClientRect()
        return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }
      }
      const style = (el) => el ? getComputedStyle(el) : null
      return {
        viewport: {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          clientWidth: document.documentElement.clientWidth,
          documentScrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
          horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          scrollX: window.scrollX,
          scrollY: window.scrollY,
        },
        media: {
          colorSchemeDark: matchMedia('(prefers-color-scheme: dark)').matches,
          reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
        },
        preview: {
          rect: rect(preview),
          className: preview?.className ?? '',
          background: style(preview)?.backgroundColor ?? null,
        },
        root: {
          rect: rect(root),
          scrollWidth: root?.scrollWidth ?? null,
          clientWidth: root?.clientWidth ?? null,
          horizontalOverflow: !!root && root.scrollWidth > root.clientWidth,
          inViewport: !!root && root.getBoundingClientRect().left >= 0 && root.getBoundingClientRect().right <= document.documentElement.clientWidth,
          background: style(root)?.backgroundColor ?? null,
        },
        focus: {
          tag: document.activeElement?.tagName ?? null,
          text: document.activeElement?.textContent?.trim().slice(0, 100) ?? '',
          ariaLabel: document.activeElement?.getAttribute('aria-label') ?? null,
          focusVisible: !!document.activeElement?.matches(':focus-visible'),
        },
      }
    })()`
  )
}

async function injectOverlay(cdp, sessionId, scenarioName) {
  const title = `[Assessment B ${scenarioName}] LxTransferPanel`
  await evaluate(
    cdp,
    sessionId,
    `(() => { document.title = ${JSON.stringify(
      title
    )}; window.__assessmentBMutableInjection = true; return { title: document.title, marker: window.__assessmentBMutableInjection } })()`
  )
  const injection = await evaluate(
    cdp,
    sessionId,
    `new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = ${JSON.stringify(detectorUrl)}
      script.onload = () => resolve({ loaded: true, src: script.src })
      script.onerror = () => resolve({ loaded: false, src: script.src })
      document.head.appendChild(script)
    })`
  )
  await delay(2600)
  const overlay = await evaluate(
    cdp,
    sessionId,
    `(() => {
      const elements = [...document.querySelectorAll('.impeccable-overlay')]
      const visible = elements.filter((el) => {
        const r = el.getBoundingClientRect()
        const s = getComputedStyle(el)
        return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden'
      })
      return {
        detectorScriptCount: [...document.scripts].filter((s) => s.src.includes('/detect.js')).length,
        marker: window.__assessmentBMutableInjection === true,
        elementCount: elements.length,
        visibleElementCount: visible.length,
        labels: [...new Set(visible.map((el) => el.textContent.trim()).filter(Boolean))].slice(0, 12),
      }
    })()`
  )
  return { injection, overlay }
}

async function prepareDemo(cdp, page, state = null) {
  await evaluate(
    cdp,
    page.sessionId,
    `document.querySelector('.transfer-panel-demo')?.scrollIntoView({ block: 'start', inline: 'nearest' })`
  )
  const settingsOpen = await evaluate(
    cdp,
    page.sessionId,
    `document.querySelector('.transfer-panel-demo__settings')?.open ?? false`
  )
  if (!settingsOpen) {
    await pointerClick(
      cdp,
      page.sessionId,
      `document.querySelector('.transfer-panel-demo__settings > summary')`
    )
  }
  await delay(150)
  if (state) {
    await pointerClick(
      cdp,
      page.sessionId,
      `Array.from(document.querySelectorAll('.transfer-panel-demo__toolbar-group button')).find((el) => el.textContent.trim() === ${JSON.stringify(
        state
      )})`
    )
    await delay(200)
  }
  await evaluate(
    cdp,
    page.sessionId,
    `document.querySelector('.transfer-panel-demo__preview')?.scrollIntoView({ block: 'center', inline: 'nearest' })`
  )
  await delay(100)
}

async function setHudByKeyboard(cdp, page) {
  await evaluate(
    cdp,
    page.sessionId,
    `document.querySelector('.transfer-panel-demo')?.scrollIntoView({ block: 'start' })`
  )
  const expression = `Array.from(document.querySelectorAll('.transfer-panel-demo__toolbar-group[aria-label="示例参数"] input[type="checkbox"]')).find((el) => el.parentElement?.textContent.includes('HUD 深色主题'))`
  const found = await tabToExpression(cdp, page.sessionId, expression)
  if (!found.found) {
    await evaluate(cdp, page.sessionId, `(${expression})?.focus()`)
  }
  const before = await evaluate(
    cdp,
    page.sessionId,
    `(${expression})?.checked ?? null`
  )
  await dispatchKey(cdp, page.sessionId, 'Space')
  const after = await evaluate(
    cdp,
    page.sessionId,
    `(${expression})?.checked ?? null`
  )
  return {
    focusMethod: found.found ? 'tab' : 'programmatic focus fallback',
    tabSteps: found.steps,
    before,
    after,
    toggledBySpace: before !== after,
  }
}

async function setMobileSelectedByKeyboard(cdp, page) {
  const sourceSelector = 'button[data-testid="mobile-source-panel"]'
  const selectedSelector = 'button[data-testid="mobile-selected-panel"]'
  const readSelected = () =>
    evaluate(
      cdp,
      page.sessionId,
      `document.querySelector(${JSON.stringify(
        selectedSelector
      )})?.getAttribute('aria-pressed')`
    )
  const activateByKey = async (key) => {
    await pointerClick(
      cdp,
      page.sessionId,
      `document.querySelector(${JSON.stringify(sourceSelector)})`
    )
    const before = await readSelected()
    const tabResult = await tabTo(cdp, page.sessionId, selectedSelector)
    if (!tabResult.found)
      await focusElement(cdp, page.sessionId, selectedSelector)
    const focusedState = await evaluate(
      cdp,
      page.sessionId,
      `(() => { const el = document.querySelector(${JSON.stringify(
        selectedSelector
      )}); return { active: document.activeElement === el, focusVisible: !!el?.matches(':focus-visible') } })()`
    )
    await dispatchKey(cdp, page.sessionId, key)
    await delay(150)
    return {
      tabResult,
      focusMethod: tabResult.found ? 'tab' : 'programmatic focus fallback',
      focusedState,
      before,
      after: await readSelected(),
    }
  }

  const enter = await activateByKey('Enter')
  const space = await activateByKey('Space')
  await pointerClick(
    cdp,
    page.sessionId,
    `document.querySelector(${JSON.stringify(sourceSelector)})`
  )
  const pointerBefore = await readSelected()
  const pointerActivated = await pointerClick(
    cdp,
    page.sessionId,
    `document.querySelector(${JSON.stringify(selectedSelector)})`
  )
  const pointerAfter = await readSelected()
  return {
    Enter: enter,
    Space: space,
    pointer: {
      clicked: pointerActivated,
      before: pointerBefore,
      after: pointerAfter,
    },
  }
}

async function runScenario(cdp, config, evidence) {
  const scenario = {
    name: config.name,
    viewport: { width: config.width, height: config.height },
    colorScheme: config.colorScheme,
    reducedMotion: config.reducedMotion,
    console: [],
    exceptions: [],
    requests: [],
    httpFailures: [],
  }
  const page = await newPage(cdp, config, { ...evidence, ...scenario })
  const { sessionId } = page
  const finish = async () => {
    await cdp
      .send('Target.disposeBrowserContext', {
        browserContextId: page.browserContextId,
      })
      .catch(() => {})
  }

  try {
    await prepareDemo(cdp, page, config.state)

    if (config.hud) {
      scenario.hudKeyboard = await setHudByKeyboard(cdp, page)
      await delay(150)
    }

    if (config.mobile) {
      scenario.mobileSwitchKeyboard = await setMobileSelectedByKeyboard(
        cdp,
        page
      )
      await evaluate(
        cdp,
        sessionId,
        `(() => { const list = document.querySelector('.lx-transfer-panel__selected'); if (list) list.scrollTop = list.scrollHeight; return true })()`
      )
      await delay(350)
      scenario.mobileSelectedContent = await evaluate(
        cdp,
        sessionId,
        `(() => {
          const list = document.querySelector('.lx-transfer-panel__selected')
          const item = [...document.querySelectorAll('.lx-transfer-panel__selected-item')].find((el) => el.textContent.includes('历史授权单位'))
          const name = item?.querySelector('.lx-transfer-panel__selected-name')
          const r = name?.getBoundingClientRect()
          return {
            itemFound: !!item,
            disclosureCount: document.querySelectorAll('.lx-transfer-panel__selected-name-disclosure').length,
            text: name?.textContent.trim() ?? '',
            textScrollWidth: name?.scrollWidth ?? null,
            textClientWidth: name?.clientWidth ?? null,
            listScrollTop: list?.scrollTop ?? null,
            listScrollHeight: list?.scrollHeight ?? null,
            listClientHeight: list?.clientHeight ?? null,
            nameRect: r ? { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom } : null,
          }
        })()`
      )
    }

    if (config.scopeInteraction) {
      const selector = '.lx-transfer-panel__scope-actions > summary'
      scenario.scopeKeyboard = {}
      for (const key of ['Enter', 'Space']) {
        await evaluate(
          cdp,
          sessionId,
          `(() => { const d = document.querySelector('.lx-transfer-panel__scope-actions'); if (d) d.open = false })()`
        )
        const keyResult = await pressKeyOnSelector(
          cdp,
          sessionId,
          selector,
          key
        )
        const opened = await evaluate(
          cdp,
          sessionId,
          `document.querySelector('.lx-transfer-panel__scope-actions')?.open ?? false`
        )
        scenario.scopeKeyboard[key] = { ...keyResult, opened }
      }

      const nameSelector =
        '.lx-transfer-panel__selected-name-disclosure > summary'
      const nameExists = await evaluate(
        cdp,
        sessionId,
        `!!document.querySelector(${JSON.stringify(nameSelector)})`
      )
      scenario.longNameDisclosure = { exists: nameExists }
      if (nameExists) {
        await evaluate(
          cdp,
          sessionId,
          `(() => { const d = document.querySelector('.lx-transfer-panel__selected-name-disclosure'); if (d) d.open = false })()`
        )
        const keyResult = await pressKeyOnSelector(
          cdp,
          sessionId,
          nameSelector,
          'Space'
        )
        await delay(250)
        scenario.longNameDisclosure = {
          ...scenario.longNameDisclosure,
          ...keyResult,
          expanded: await evaluate(
            cdp,
            sessionId,
            `document.querySelector('.lx-transfer-panel__selected-name-disclosure')?.open ?? false`
          ),
          geometry: await evaluate(
            cdp,
            sessionId,
            `(() => {
        const full = document.querySelector('.lx-transfer-panel__selected-name-full')
        const list = document.querySelector('.lx-transfer-panel__selected')
        const panel = document.querySelector('.lx-transfer-panel__panel[aria-labelledby*="selected-title"]')
        const item = full?.closest('.lx-transfer-panel__selected-item')
        const code = item?.querySelector('.lx-transfer-panel__node-code')
        const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom } }
            const a = r(full), b = r(list), c = r(panel), d = r(code)
            const overlapWidth = a&&d ? Math.max(0, Math.min(a.x+a.width,d.x+d.width)-Math.max(a.x,d.x)) : 0
            const overlapHeight = a&&d ? Math.max(0, Math.min(a.y+a.height,d.y+d.height)-Math.max(a.y,d.y)) : 0
            const fullStyle = full ? getComputedStyle(full) : null
            return { full:a, code:d, list:b, panel:c, overlapArea:overlapWidth*overlapHeight, overlapPercent: a&&a.width*a.height ? Math.round(overlapWidth*overlapHeight/(a.width*a.height)*100) : null, fullDisplay:fullStyle?.display ?? null, fullVisibility:fullStyle?.visibility ?? null, detailsOpen:!!full?.closest('details')?.open, fullWithinList:!!a&&!!b&&a.y>=b.y&&a.bottom<=b.bottom, fullWithinPanel:!!a&&!!c&&a.y>=c.y&&a.bottom<=c.bottom, textClipped:!!full&&full.scrollHeight>full.clientHeight+1 }
          })()`
          ),
        }
        scenario.longNameDisclosure.expandedScreenshot = await screenshot(
          cdp,
          sessionId,
          `${config.name}-selected-name-expanded.png`
        )
        await evaluate(
          cdp,
          sessionId,
          `(() => { const d = document.querySelector('.lx-transfer-panel__selected-name-disclosure'); if (d) d.open = false })()`
        )
      }

      await evaluate(
        cdp,
        sessionId,
        `(() => { const d = document.querySelector('.lx-transfer-panel__scope-actions'); if (d) d.open = false })()`
      )
      const pointerOpened = await pointerClick(
        cdp,
        sessionId,
        `document.querySelector('.lx-transfer-panel__scope-actions > summary')`
      )
      scenario.scopeMenuPointerOpened =
        pointerOpened &&
        (await evaluate(
          cdp,
          sessionId,
          `document.querySelector('.lx-transfer-panel__scope-actions')?.open ?? false`
        ))
      scenario.scopeMenu = await evaluate(
        cdp,
        sessionId,
        `(() => {
        const d = document.querySelector('.lx-transfer-panel__scope-actions')
        const summary = d?.querySelector('summary')
        const content = d?.querySelector('.lx-transfer-panel__scope-action-content')
        const button = content?.querySelector('button')
        const panel = d?.closest('.lx-transfer-panel__panel')
        const rect = (el) => { if (!el) return null; const r=el.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom} }
        const m=rect(content), p=rect(panel), b=rect(button)
        return { open:!!d?.open, focusVisible:!!summary?.matches(':focus-visible'), summary:rect(summary), menu:m, button:b, panel:p, menuWithinPanel:!!m&&!!p&&m.x>=p.x&&m.right<=p.right&&m.y>=p.y&&m.bottom<=p.bottom, menuInViewport:!!m&&m.x>=0&&m.right<=document.documentElement.clientWidth&&m.y>=0&&m.bottom<=window.innerHeight, buttonVisible:!!button&&!!m&&b.x>=m.x&&b.right<=m.right&&b.y>=m.y&&b.bottom<=m.bottom, text:content?.innerText.trim() ?? '' }
      })()`
      )
    }

    if (config.retryInteraction) {
      const retrySelector = '.transfer-panel-demo__message button'
      scenario.errorStateBeforeRetry = await evaluate(
        cdp,
        sessionId,
        `(() => {
        const surface = document.querySelector('.transfer-panel-demo__surface')
        const button = document.querySelector(${JSON.stringify(retrySelector)})
        return { status:document.querySelector('.transfer-panel-demo__status')?.innerText.trim() ?? '', ariaBusy:surface?.getAttribute('aria-busy'), inert:surface?.inert ?? false, retryPresent:!!button, retryDisabled:button?.disabled ?? null, retryTabIndex:button?.tabIndex ?? null, message:document.querySelector('.transfer-panel-demo__message')?.innerText.trim() ?? '' }
      })()`
      )
      scenario.retryClicked = await pointerClick(
        cdp,
        sessionId,
        `document.querySelector(${JSON.stringify(retrySelector)})`
      )
      await delay(250)
      scenario.errorStateAfterRetry = await evaluate(
        cdp,
        sessionId,
        `(() => ({ status:document.querySelector('.transfer-panel-demo__status')?.innerText.trim() ?? '', state:document.querySelector('.transfer-panel-demo__message')?.innerText.trim() ?? '', selectedCount:document.querySelector('[data-testid="selected-count"]')?.innerText.trim() ?? '' }))()`
      )
      await pointerClick(
        cdp,
        sessionId,
        `Array.from(document.querySelectorAll('.transfer-panel-demo__toolbar-group button')).find((el) => el.textContent.trim() === '加载失败')`
      )
      await delay(100)
    }

    scenario.preOverlay = await metrics(cdp, sessionId)
    scenario.screenshots = {
      beforeOverlay: await screenshot(
        cdp,
        sessionId,
        `${config.name}-before-overlay.png`
      ),
    }
    scenario.mutableInjection = await injectOverlay(cdp, sessionId, config.name)
    scenario.postOverlay = await metrics(cdp, sessionId)
    scenario.consoleFindings = scenario.console
      .map((entry) => entry.text)
      .filter((text) => text.includes('[impeccable]') || text.includes('%c'))
    scenario.screenshots.overlay = await screenshot(
      cdp,
      sessionId,
      `${config.name}-overlay.png`
    )
  } finally {
    await finish()
  }
  return scenario
}

function startAndCapture(child, stdoutFile, stderrFile) {
  const stdout = fs.createWriteStream(stdoutFile, { flags: 'w' })
  const stderr = fs.createWriteStream(stderrFile, { flags: 'w' })
  child.stdout?.pipe(stdout)
  child.stderr?.pipe(stderr)
  return { stdout, stderr }
}

async function waitForHttp(url, timeout = 20000) {
  const end = Date.now() + timeout
  let lastError = null
  while (Date.now() < end) {
    try {
      const response = await fetch(url)
      if (response.ok) return response
      lastError = new Error(`HTTP ${response.status} from ${url}`)
    } catch (error) {
      lastError = error
    }
    await delay(150)
  }
  throw lastError ?? new Error(`Timed out waiting for ${url}`)
}

async function waitForDebugEndpoint(url, timeout = 20000) {
  const end = Date.now() + timeout
  let lastError = null
  while (Date.now() < end) {
    try {
      const response = await fetch(url)
      if (response.ok) return response.json()
    } catch (error) {
      lastError = error
    }
    await delay(150)
  }
  throw lastError ?? new Error(`Timed out waiting for ${url}`)
}

function portHasListener(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port })
    socket.setTimeout(500)
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('error', () => resolve(false))
    socket.once('timeout', () => {
      socket.destroy()
      resolve(false)
    })
  })
}

const evidence = {
  target,
  previewUrl,
  detectorUrl,
  ports: {
    preview: 4199,
    detector: detectorPort,
    chromeDevTools: debugPort,
    protectedUserPreview: 4174,
  },
  sourceHashBefore: hashFile(target),
  expectedHash,
  sourceMatchesDetectorHash: hashFile(target) === expectedHash,
  browser: null,
  scenarios: [],
  allConsole: [],
  cleanup: null,
  startedAt: new Date().toISOString(),
}

let runtimeDir = null
let liveServerStart = null
let liveServerStop = null
let chrome = null
let chromeExited = false
let chromeExitCode = null
let chromeSignal = null
let cdp = null
let browserProfile = null
let chromeLog = null

try {
  if (evidence.sourceHashBefore !== expectedHash) {
    throw new Error(
      `Source hash changed before browser run: ${evidence.sourceHashBefore}`
    )
  }

  runtimeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wave7-b-live-server-'))
  liveServerStart = spawnSync(
    process.execPath,
    [liveServerScript, '--background', `--port=${detectorPort}`],
    {
      cwd: runtimeDir,
      encoding: 'utf8',
      windowsHide: true,
      timeout: 20000,
    }
  )
  fs.writeFileSync(
    path.join(outputDir, 'detector-server-start.stderr.log'),
    liveServerStart.stderr ?? ''
  )
  fs.writeFileSync(
    path.join(outputDir, 'detector-server-start.exit-code.txt'),
    `${liveServerStart.status ?? 'null'}\n`
  )
  if (liveServerStart.status !== 0) {
    fs.writeFileSync(
      path.join(outputDir, 'detector-server-start.stdout.json'),
      liveServerStart.stdout ?? ''
    )
    throw new Error(
      `Detector server failed to start: ${liveServerStart.stderr ?? ''}`
    )
  }
  const liveInfo = JSON.parse(liveServerStart.stdout.trim())
  const safeLiveInfo = {
    pid: liveInfo.pid ?? null,
    port: liveInfo.port ?? null,
    sessionTokenPresent: Boolean(liveInfo.token),
    sessionToken: liveInfo.token ? '[redacted]' : null,
  }
  fs.writeFileSync(
    path.join(outputDir, 'detector-server-start.stdout.json'),
    `${JSON.stringify(safeLiveInfo, null, 2)}\n`
  )
  if (liveInfo.port !== detectorPort || !Number.isInteger(liveInfo.pid)) {
    throw new Error(
      `Detector server start record did not include the expected PID and port: ${JSON.stringify(
        safeLiveInfo
      )}`
    )
  }
  evidence.detectorServer = {
    pid: liveInfo.pid,
    port: liveInfo.port,
    sessionTokenPresent: Boolean(liveInfo.token),
    sessionTokenStored: false,
  }
  const detectorAssetResponse = await waitForHttp(detectorUrl)
  const detectorAsset = await detectorAssetResponse.text()
  fs.writeFileSync(
    path.join(outputDir, 'detector-asset-http.json'),
    `${JSON.stringify(
      {
        url: detectorUrl,
        status: detectorAssetResponse.status,
        bytes: Buffer.byteLength(detectorAsset),
        checkedAt: new Date().toISOString(),
      },
      null,
      2
    )}\n`
  )

  const versionEndpoint = `http://127.0.0.1:${debugPort}/json/version`
  if (await portHasListener(debugPort)) {
    throw new Error(`Chrome DevTools port ${debugPort} already has a listener`)
  }
  browserProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'wave7-b-chrome-'))
  chromeLog = fs.openSync(path.join(outputDir, 'chrome-stderr.log'), 'w')
  const chromeArgs = [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    '--remote-debugging-address=127.0.0.1',
    '--remote-allow-origins=*',
    `--user-data-dir=${browserProfile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-extensions',
    '--disable-sync',
    'about:blank',
  ]
  fs.writeFileSync(
    path.join(outputDir, 'browser-command.txt'),
    `${JSON.stringify(
      {
        runner: fileURLToPath(import.meta.url),
        outputDir,
        executable: chromePath,
        args: chromeArgs,
        previewUrl,
        detectorUrl,
        viewportContexts: scenarioFilter ? 1 : 6,
        scenarioFilter,
        screenshotOrder:
          'beforeOverlay is captured before detector script injection',
      },
      null,
      2
    )}\n`
  )
  chrome = spawn(chromePath, chromeArgs, {
    stdio: ['ignore', 'ignore', chromeLog],
    windowsHide: true,
  })
  chrome.once('exit', (code, signal) => {
    chromeExited = true
    chromeExitCode = code
    chromeSignal = signal
  })
  const version = await waitForDebugEndpoint(versionEndpoint)
  evidence.browser = {
    product: version.Browser,
    protocolVersion: version['Protocol-Version'],
    userAgent: version['User-Agent'],
    freshProfile: true,
    chromePid: chrome.pid,
  }

  const socket = new WebSocket(version.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  cdp = new CdpClient(socket)
  const browserInfo = await cdp.send('Browser.getVersion')
  evidence.browser.version = browserInfo

  const routeResponse = await waitForHttp(previewUrl, 45000)
  evidence.previewResponse = {
    status: routeResponse.status,
    finalUrl: routeResponse.url,
  }

  const configs = [
    {
      name: 'desktop-light-scope-and-keyboard',
      width: 1440,
      height: 960,
      mobile: false,
      colorScheme: 'light',
      reducedMotion: 'no-preference',
      scopeInteraction: true,
    },
    {
      name: 'desktop-hud-dark-keyboard',
      width: 1440,
      height: 960,
      mobile: false,
      colorScheme: 'light',
      reducedMotion: 'no-preference',
      hud: true,
    },
    {
      name: 'desktop-light-empty-state',
      width: 1440,
      height: 960,
      mobile: false,
      colorScheme: 'light',
      reducedMotion: 'no-preference',
      state: '空结果',
    },
    {
      name: 'desktop-light-loading-state',
      width: 1440,
      height: 960,
      mobile: false,
      colorScheme: 'light',
      reducedMotion: 'no-preference',
      state: '加载中',
    },
    {
      name: 'desktop-light-error-retry-state',
      width: 1440,
      height: 960,
      mobile: false,
      colorScheme: 'light',
      reducedMotion: 'no-preference',
      state: '加载失败',
      retryInteraction: true,
    },
    {
      name: 'mobile-375-light-reduced-motion-selected-long-name',
      width: 375,
      height: 812,
      mobile: true,
      colorScheme: 'light',
      reducedMotion: 'reduce',
      mobile: true,
    },
  ]

  const selectedConfigs = scenarioFilter
    ? configs.filter((config) => config.name === scenarioFilter)
    : configs
  if (scenarioFilter && selectedConfigs.length === 0) {
    throw new Error(`Unknown browser scenario: ${scenarioFilter}`)
  }

  for (const config of selectedConfigs) {
    try {
      const scenario = await runScenario(cdp, config, evidence)
      evidence.scenarios.push(scenario)
    } catch (error) {
      evidence.scenarios.push({
        name: config.name,
        failed: true,
        error: error.message,
      })
    }
  }
} catch (error) {
  evidence.failure = error.message
} finally {
  if (cdp) {
    await cdp.send('Browser.close').catch(() => {})
    cdp.socket.close()
  }
  if (chrome && !chromeExited) {
    chrome.kill()
    await Promise.race([
      new Promise((resolve) => chrome.once('exit', resolve)),
      delay(5000),
    ])
  }
  if (chromeLog !== null) fs.closeSync(chromeLog)

  if (liveServerStart?.status === 0 && runtimeDir) {
    liveServerStop = spawnSync(
      process.execPath,
      [liveServerScript, 'stop', '--keep-inject'],
      {
        cwd: runtimeDir,
        encoding: 'utf8',
        windowsHide: true,
        timeout: 20000,
      }
    )
    fs.writeFileSync(
      path.join(outputDir, 'detector-server-stop.stdout.log'),
      liveServerStop.stdout ?? ''
    )
    fs.writeFileSync(
      path.join(outputDir, 'detector-server-stop.stderr.log'),
      liveServerStop.stderr ?? ''
    )
    fs.writeFileSync(
      path.join(outputDir, 'detector-server-stop.exit-code.txt'),
      `${liveServerStop.status ?? 'null'}\n`
    )
  }

  const profileRemoved = browserProfile
    ? (() => {
        try {
          fs.rmSync(browserProfile, { recursive: true, force: true })
          return !fs.existsSync(browserProfile)
        } catch {
          return false
        }
      })()
    : false
  const runtimeRemoved = runtimeDir
    ? (() => {
        try {
          const tempRoot = path.resolve(os.tmpdir())
          const resolved = path.resolve(runtimeDir)
          if (!resolved.startsWith(`${tempRoot}${path.sep}`)) return false
          fs.rmSync(resolved, { recursive: true, force: true })
          return !fs.existsSync(resolved)
        } catch {
          return false
        }
      })()
    : false

  evidence.sourceHashAfter = hashFile(target)
  evidence.sourceUnchanged =
    evidence.sourceHashBefore === evidence.sourceHashAfter
  evidence.cleanup = {
    chromeExitCode,
    chromeSignal,
    chromeProcessExited: chromeExited,
    browserProfileRemoved: profileRemoved,
    detectorServerExitCode: liveServerStop?.status ?? null,
    detectorServerStopStdout: liveServerStop?.stdout ?? '',
    detectorServerStopStderr: liveServerStop?.stderr ?? '',
    detectorRuntimeRemoved: runtimeRemoved,
    portListenersAfter: {
      preview4199: await portHasListener(4199),
      detector8401: await portHasListener(detectorPort),
      chrome9333: await portHasListener(debugPort),
      protectedPreview4174: await portHasListener(4174),
    },
    finishedAt: new Date().toISOString(),
  }
}

fs.writeFileSync(
  path.join(outputDir, 'browser-console.json'),
  `${JSON.stringify(evidence.allConsole, null, 2)}\n`
)
fs.writeFileSync(
  path.join(outputDir, 'browser-evidence.json'),
  `${JSON.stringify(evidence, null, 2)}\n`
)

if (
  evidence.failure ||
  !evidence.sourceUnchanged ||
  evidence.scenarios.some((scenario) => scenario.failed)
) {
  process.exitCode = 1
}
