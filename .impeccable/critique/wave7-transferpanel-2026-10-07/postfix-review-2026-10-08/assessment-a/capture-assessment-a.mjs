import { spawn } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const outputDir = path.resolve(
  '.impeccable/critique/wave7-transferpanel-2026-10-07/postfix-review-2026-10-08/assessment-a',
)
const edgePath = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const port = 19227
const profileDir = path.join(
  tmpdir(),
  `linkx-wave7-assessment-a-${Date.now()}-${process.pid}`,
)

await mkdir(outputDir, { recursive: true })

const edge = spawn(
  edgePath,
  [
    `--remote-debugging-port=${port}`,
    '--remote-allow-origins=*',
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--new-window',
    'about:blank',
  ],
  { stdio: 'ignore', windowsHide: true },
)

const base = `http://127.0.0.1:${port}`
let browserVersion
for (let attempt = 0; attempt < 80; attempt += 1) {
  try {
    const response = await fetch(`${base}/json/version`)
    if (response.ok) {
      browserVersion = await response.json()
      break
    }
  } catch {}
  await delay(250)
}

if (!browserVersion) {
  edge.kill()
  throw new Error('独立 Edge profile 未能开放 DevTools 端口')
}

const targets = await (await fetch(`${base}/json/list`)).json()
const target = targets.find((item) => item.type === 'page')
if (!target?.webSocketDebuggerUrl) {
  edge.kill()
  throw new Error('未找到独立 Edge profile 的新页面')
}

const socket = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true })
  socket.addEventListener('error', reject, { once: true })
})

let nextId = 0
const pending = new Map()
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  if (!message.id) return
  const callbacks = pending.get(message.id)
  if (!callbacks) return
  pending.delete(message.id)
  if (message.error) callbacks.reject(new Error(message.error.message))
  else callbacks.resolve(message.result ?? {})
})

function command(method, params = {}) {
  const id = ++nextId
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    socket.send(JSON.stringify({ id, method, params }))
  })
}

async function evaluate(expression) {
  const result = await command('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  })
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? '浏览器表达式执行失败')
  }
  return result.result?.value
}

async function waitFor(selector, timeout = 18000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (await evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`)) {
      return
    }
    await delay(200)
  }
  throw new Error(`等待页面元素超时: ${selector}`)
}

async function setViewport(width, height) {
  await command('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 600,
    screenOrientation:
      width < 600 ? { type: 'portraitPrimary', angle: 0 } : undefined,
  })
  await delay(250)
}

async function navigate(url, selector) {
  await command('Page.navigate', { url })
  await waitFor(selector)
  await delay(700)
  return evaluate('document.title')
}

async function scrollTo(selector) {
  await evaluate(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)})
    if (!element) return false
    const top = element.getBoundingClientRect().top + window.scrollY - 88
    window.scrollTo(0, Math.max(0, top))
    return true
  })()`)
  await delay(300)
}

async function screenshot(name) {
  const result = await command('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  })
  await writeFile(path.join(outputDir, name), Buffer.from(result.data, 'base64'))
}

async function inputValue(selector, value) {
  await evaluate(`(() => {
    const input = document.querySelector(${JSON.stringify(selector)})
    if (!input) return false
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    setter.call(input, ${JSON.stringify(value)})
    input.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      inputType: 'insertText',
      data: ${JSON.stringify(value)},
    }))
    return true
  })()`)
  await delay(500)
}

async function key(key, code, virtualKey) {
  await command('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key,
    code,
    windowsVirtualKeyCode: virtualKey,
  })
  await command('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key,
    code,
    windowsVirtualKeyCode: virtualKey,
  })
  await delay(250)
}

const evidence = {
  assessment: 'A: 独立设计评审与浏览器视觉证据',
  captureContext: {
    browser: browserVersion.Browser,
    userDataDir: profileDir,
    independentEdgeProfile: true,
    newPageTargetId: target.id,
    devtoolsPort: port,
  },
  screenshots: {},
  checks: {},
}

try {
  await command('Page.enable')
  await command('Runtime.enable')

  await setViewport(1440, 1000)
  const transferUrl = 'http://127.0.0.1:4174/components/lxtransferpanel.html'
  evidence.screenshots.transferPanelDesktop = 'transfer-panel-desktop-1440.png'
  evidence.pages = { transferPanel: { url: transferUrl } }
  evidence.pages.transferPanel.title = await navigate(
    transferUrl,
    '.transfer-panel-demo .lx-transfer-panel',
  )
  await scrollTo('.transfer-panel-demo .lx-transfer-panel')
  await screenshot(evidence.screenshots.transferPanelDesktop)

  evidence.checks.transferPanelInitial = await evaluate(`(() => {
    const description = document.querySelector('.lx-transfer-panel__inherit-description')
    const checkbox = document.querySelector('.lx-transfer-panel__inherit-control input[type="checkbox"]')
    return {
      viewport: { width: innerWidth, height: innerHeight },
      documentScrollWidth: document.documentElement.scrollWidth,
      transferWidth: document.querySelector('.lx-transfer-panel').getBoundingClientRect().width,
      initialSelectedCount: document.querySelector('.lx-transfer-panel__footer strong')?.textContent,
      inheritDescription: description?.textContent.trim(),
      inheritDescriptionVisible: Boolean(description?.getClientRects().length),
      inheritDescriptionId: description?.id,
      inheritCheckboxDisabled: checkbox?.disabled,
      inheritCheckboxDescribedBy: checkbox?.getAttribute('aria-describedby'),
    }
  })()`)

  await inputValue(
    '.lx-transfer-panel__filter--source input',
    '待授权特勤支队',
  )
  const transferFilterBefore = await evaluate(`(() => ({
    status: document.querySelector('.lx-transfer-panel__header-status')?.textContent.trim(),
    resultRows: [...document.querySelectorAll('.lx-transfer-panel__tree [role="treeitem"]')]
      .map((row) => ({ key: row.dataset.lxTreeKey, label: row.querySelector('.lx-virtual-tree__label')?.textContent.trim() })),
    selectButtonDisabled: document.querySelector('button[aria-label="全选筛选结果"]')?.disabled,
  }))()`)
  await evaluate(`document.querySelector('button[aria-label="全选筛选结果"]')?.click()`)
  await delay(500)
  evidence.checks.transferPanelFilteredOperation = {
    before: transferFilterBefore,
    after: await evaluate(`(() => ({
      status: document.querySelector('.lx-transfer-panel__header-status')?.textContent.trim(),
      selectedCount: document.querySelector('.lx-transfer-panel__footer strong')?.textContent,
      selectedRows: document.querySelectorAll('.lx-transfer-panel__selected-item').length,
      hostFeedback: document.querySelector('.transfer-panel-demo__status')?.textContent.trim(),
    }))()`),
  }

  await setViewport(375, 812)
  await inputValue(
    '.lx-transfer-panel__filter--source input',
    '历史归档机构 02 单位 001',
  )
  await scrollTo('.transfer-panel-demo .lx-transfer-panel')
  evidence.screenshots.transferPanelMobile = 'transfer-panel-mobile-375.png'
  await screenshot(evidence.screenshots.transferPanelMobile)
  evidence.checks.transferPanelMobileLongRow = await evaluate(`(() => {
    const row = document.querySelector('[data-lx-tree-key="division-02-unit-001"]')
    const label = row?.querySelector('.lx-virtual-tree__label')
    const style = label ? getComputedStyle(label) : undefined
    const lineHeight = style ? Number.parseFloat(style.lineHeight) : NaN
    return {
      viewport: { width: innerWidth, height: innerHeight },
      documentScrollWidth: document.documentElement.scrollWidth,
      rowFound: Boolean(row),
      rowHeight: row?.getBoundingClientRect().height,
      rowCssHeight: row?.style.height,
      label: label?.textContent.trim(),
      labelWidth: label?.getBoundingClientRect().width,
      labelHeight: label?.getBoundingClientRect().height,
      labelLineHeight: style?.lineHeight,
      labelEstimatedLines: label && Number.isFinite(lineHeight)
        ? Math.round(label.getBoundingClientRect().height / lineHeight)
        : undefined,
      labelWhiteSpace: style?.whiteSpace,
      labelOverflowWrap: style?.overflowWrap,
      codeMetaVisible: Boolean(row?.querySelector('.lx-transfer-panel__node-code')),
      metaHeight: row?.querySelector('.lx-transfer-panel__node-meta')?.getBoundingClientRect().height,
    }
  })()`)
  const originalLongRowLabel = '历史归档机构 02 单位 001'
  const syntheticLongLabel =
    '跨区域应急联动指挥中心综合研判与协同处置专班管理节点移动端长名称压力样例'
  await evaluate(`(() => {
    const row = document.querySelector('[data-lx-tree-key="division-02-unit-001"]')
    const label = row?.querySelector('.lx-virtual-tree__label')
    if (!label) return false
    label.textContent = ${JSON.stringify(syntheticLongLabel)}
    label.title = ${JSON.stringify(syntheticLongLabel)}
    return true
  })()`)
  await delay(200)
  evidence.screenshots.transferPanelMobileLongLabelStress =
    'transfer-panel-mobile-long-label-stress-375.png'
  await screenshot(evidence.screenshots.transferPanelMobileLongLabelStress)
  evidence.checks.transferPanelMobileLongRowStress = await evaluate(`(() => {
    const row = document.querySelector('[data-lx-tree-key="division-02-unit-001"]')
    const label = row?.querySelector('.lx-virtual-tree__label')
    const style = label ? getComputedStyle(label) : undefined
    return {
      syntheticDomOnly: true,
      labelLength: label?.textContent.length,
      rowHeight: row?.getBoundingClientRect().height,
      labelWidth: label?.getBoundingClientRect().width,
      labelHeight: label?.getBoundingClientRect().height,
      labelScrollHeight: label?.scrollHeight,
      labelLineHeight: style?.lineHeight,
      labelLineClamp: style?.webkitLineClamp,
      labelWhiteSpace: style?.whiteSpace,
      titlePreservesFullText: label?.title === label.textContent,
    }
  })()`)
  await evaluate(`(() => {
    const row = document.querySelector('[data-lx-tree-key="division-02-unit-001"]')
    const label = row?.querySelector('.lx-virtual-tree__label')
    if (!label) return false
    label.textContent = ${JSON.stringify(originalLongRowLabel)}
    label.title = ${JSON.stringify(originalLongRowLabel)}
    return true
  })()`)

  await evaluate(`(() => {
    const button = [...document.querySelectorAll('.lx-transfer-panel__mobile-switch button')]
      .find((item) => item.textContent.includes('已选'))
    button?.click()
  })()`)
  await delay(350)
  evidence.screenshots.transferPanelMobileInheritance = 'transfer-panel-mobile-inheritance-375.png'
  await screenshot(evidence.screenshots.transferPanelMobileInheritance)
  evidence.checks.transferPanelInheritance = await evaluate(`(() => {
    const control = document.querySelector('.lx-transfer-panel__inherit-control')
    const checkbox = control?.querySelector('input[type="checkbox"]')
    const description = control?.querySelector('.lx-transfer-panel__inherit-description')
    return {
      descriptionVisible: Boolean(description?.getClientRects().length),
      descriptionText: description?.textContent.trim(),
      checkboxDisabled: checkbox?.disabled,
      checkboxFocused: document.activeElement === checkbox,
      checkboxCheckedBeforeKeyboard: checkbox?.checked,
      checkboxDescribedBy: checkbox?.getAttribute('aria-describedby'),
      mobileSelectedPanelVisible: Boolean(document.querySelector('.lx-transfer-panel__panel:not(.is-mobile-hidden) .lx-transfer-panel__inherit-control')),
    }
  })()`)
  await evaluate(`document.querySelector('.lx-transfer-panel__inherit-control input[type="checkbox"]')?.focus()`)
  await key(' ', 'Space', 32)
  evidence.checks.transferPanelInheritance.keyboardAfter = await evaluate(`(() => ({
    checkboxChecked: document.querySelector('.lx-transfer-panel__inherit-control input[type="checkbox"]')?.checked,
    hostFeedback: document.querySelector('.transfer-panel-demo__status')?.textContent.trim(),
    activeElement: document.activeElement?.outerHTML.slice(0, 180),
  }))()`)

  await setViewport(1440, 1000)
  const treeUrl = 'http://127.0.0.1:4174/components/lxvirtualtree.html'
  evidence.screenshots.virtualTreeDesktop = 'virtual-tree-desktop-1440.png'
  evidence.pages.virtualTree = { url: treeUrl }
  evidence.pages.virtualTree.title = await navigate(
    treeUrl,
    '.virtual-tree-demo .lx-virtual-tree__viewport',
  )
  await scrollTo('.virtual-tree-demo .lx-virtual-tree')

  await evaluate(`document.querySelector('.lx-virtual-tree')?.__vueParentComponent?.exposed?.scrollToKey('region-2')`)
  await delay(250)
  await evaluate(`document.querySelector('[data-lx-tree-key="region-2"]')?.focus()`)
  await inputValue('.lx-virtual-tree__filter input', '执勤单元 1')
  await delay(200)
  const filteredTree = await evaluate(`(() => ({
    filter: document.querySelector('.lx-virtual-tree__filter input')?.value,
    focusedKeyAfterFilter: document.activeElement?.dataset?.lxTreeKey,
    rows: [...document.querySelectorAll('.lx-virtual-tree__row')].map((row) => ({
      key: row.dataset.lxTreeKey,
      level: row.getAttribute('aria-level'),
      posinset: row.getAttribute('aria-posinset'),
      setsize: row.getAttribute('aria-setsize'),
      expanded: row.getAttribute('aria-expanded'),
      disabled: row.getAttribute('aria-disabled'),
    })),
    visibleMatchingRows: document.querySelectorAll('.lx-virtual-tree__row[data-lx-tree-key^="unit-2-1"]').length,
  }))()`)

  await key('ArrowRight', 'ArrowRight', 39)
  const afterRight = await evaluate('document.activeElement?.dataset?.lxTreeKey')
  await key('ArrowDown', 'ArrowDown', 40)
  const afterDown = await evaluate('document.activeElement?.dataset?.lxTreeKey')
  await key(' ', 'Space', 32)
  const afterKeyboardSelection = await evaluate(`(() => ({
    selectedCount: document.querySelector('.virtual-tree-demo__summary span:first-child')?.textContent.trim(),
    status: document.querySelector('.lx-virtual-tree__selection-status')?.textContent.trim(),
    demoFeedback: document.querySelector('.virtual-tree-demo__status')?.textContent.trim(),
    focusedKey: document.activeElement?.dataset?.lxTreeKey,
  }))()`)

  await evaluate(`document.querySelector('[data-lx-tree-key="region-2"]')?.focus()`)
  await key(' ', 'Space', 32)
  await delay(350)
  const cascadeAfter = await evaluate(`(() => {
    const tree = document.querySelector('.lx-virtual-tree')
    const component = tree?.__vueParentComponent
    const checkedKeys = component?.exposed?.getCheckedKeys?.()
    return {
      selectedCount: document.querySelector('.virtual-tree-demo__summary span:first-child')?.textContent.trim(),
      status: document.querySelector('.lx-virtual-tree__selection-status')?.textContent.trim(),
      demoFeedback: document.querySelector('.virtual-tree-demo__status')?.textContent.trim(),
      region2Checked: document.querySelector('[data-lx-tree-key="region-2"]')?.getAttribute('aria-checked'),
      checkedKeyCount: Array.isArray(checkedKeys) ? checkedKeys.length : undefined,
      disabledDescendantSelected: Array.isArray(checkedKeys) ? checkedKeys.includes('unit-2-5') : undefined,
      checkedKeys: Array.isArray(checkedKeys) ? checkedKeys : undefined,
      focusedKey: document.activeElement?.dataset?.lxTreeKey,
    }
  })()`)
  await scrollTo('.virtual-tree-demo .lx-virtual-tree')
  await screenshot(evidence.screenshots.virtualTreeDesktop)

  await setViewport(375, 812)
  await scrollTo('.virtual-tree-demo .lx-virtual-tree')
  evidence.screenshots.virtualTreeMobile = 'virtual-tree-mobile-375.png'
  await screenshot(evidence.screenshots.virtualTreeMobile)
  evidence.checks.virtualTree = {
    filteredPositions: filteredTree,
    keyboard: {
      arrowRightFocusedKey: afterRight,
      arrowDownFocusedKey: afterDown,
      afterSelection: afterKeyboardSelection,
    },
    cascade: cascadeAfter,
    mobileViewport: await evaluate(`(() => ({
      width: innerWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      treeWidth: document.querySelector('.lx-virtual-tree__viewport')?.getBoundingClientRect().width,
      focusedKey: document.activeElement?.dataset?.lxTreeKey,
    }))()`),
  }
} finally {
  try {
    await command('Browser.close')
  } catch {}
  socket.close()
  await delay(500)
  try {
    edge.kill()
  } catch {}
  await delay(500)
  try {
    await rm(profileDir, { recursive: true, force: true })
  } catch {}
}

await writeFile(
  path.join(outputDir, 'browser-capture-summary.json'),
  `${JSON.stringify(evidence, null, 2)}\n`,
)
