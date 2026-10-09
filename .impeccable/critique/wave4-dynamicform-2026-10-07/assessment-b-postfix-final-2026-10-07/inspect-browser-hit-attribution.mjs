import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const repoRoot = process.cwd()
const outputRoot = path.resolve(
  repoRoot,
  '.impeccable/critique/wave4-dynamicform-2026-10-07/assessment-b-postfix-final-2026-10-07',
)
const evidence = JSON.parse(
  await fs.readFile(path.join(outputRoot, 'browser-evidence/browser-evidence.json'), 'utf8'),
)
const playwrightEntry = path.join(
  repoRoot,
  'other-admin/admin-vue3/node_modules/.pnpm/playwright@1.58.0/node_modules/playwright/index.mjs',
)
const { chromium } = await import(pathToFileURL(playwrightEntry).href)
const browserExecutable = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const targetConfig = {
  lxdynamicform: {
    route: '/components/lxdynamicform',
    hudLabel: '文档站整体深色（HUD）',
    hudDisclosure: '.dynamic-form-demo__settings',
  },
  lxdatepicker: { route: '/components/lxdatepicker', hudLabel: 'HUD 深色主题' },
  lxupload: { route: '/components/lxupload', hudLabel: 'HUD 深色主题' },
}
const shellSelector = '.VPNavBar, .VPSidebar, .VPFooter, .VPDocFooter, .VPDocAside, .VPContent, .VPDoc, .VPHome'
const output = []

const browser = await chromium.launch({ headless: true, executablePath: browserExecutable })
try {
  for (const target of evidence.targets) {
    const config = targetConfig[target.target]
    const unresolved = target.views.flatMap((view) =>
      view.findings
        .filter((row) => row.attribution === '待人工核对')
        .map((row) => ({ view, selector: row.selector, row })),
    )
    if (unresolved.length === 0) continue

    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
    const page = await context.newPage()
    const response = await page.goto(`${evidence.docsBaseUrl}${config.route}`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    })
    if (!response?.ok()) throw new Error(`${target.target} returned HTTP ${response?.status()}`)

    let hudEnabled = false
    const details = []
    for (const entry of unresolved) {
      const view = entry.view
      await page.setViewportSize(view.viewport)
      const shouldUseHud = view.theme === 'HUD'
      if (hudEnabled !== shouldUseHud) {
        const hudText = page.getByText(config.hudLabel, { exact: true }).first()
        if (!(await hudText.isVisible().catch(() => false)) && config.hudDisclosure) {
          const disclosure = page.locator(config.hudDisclosure)
          const isOpen = await disclosure.evaluate((element) => element.open)
          if (!isOpen) await disclosure.locator('summary').click()
        }
        await hudText.click()
        hudEnabled = shouldUseHud
        if (config.hudDisclosure) {
          const disclosure = page.locator(config.hudDisclosure)
          if (await disclosure.evaluate((element) => element.open)) {
            await disclosure.locator('summary').click()
          }
        }
      }
      await page.waitForTimeout(250)
      const nodeInfo = await page.evaluate(({ selector, shellSelector }) => {
        const element = document.querySelector(selector)
        if (!element) return { found: false, selector }
        const chain = []
        let current = element
        for (let depth = 0; current && depth < 9; depth += 1, current = current.parentElement) {
          chain.push({
            tag: current.tagName.toLowerCase(),
            id: current.id || null,
            className: typeof current.className === 'string'
              ? current.className
              : current.className?.baseVal || null,
          })
        }
        const componentRoot = element.closest(
          '.dynamic-form-demo, .lx-date-picker-demo, .lx-upload-demo, .lx-dynamic-form, .lx-date-picker, .lx-upload',
        )
        const shellRoot = element.closest(shellSelector)
        return {
          found: true,
          selector,
          tagName: element.tagName.toLowerCase(),
          id: element.id || null,
          className: typeof element.className === 'string'
            ? element.className
            : element.className?.baseVal || null,
          text: (element.textContent || '').trim().slice(0, 120),
          componentRoot: componentRoot?.className?.baseVal ?? componentRoot?.className ?? null,
          shellRoot: shellRoot?.className?.baseVal ?? shellRoot?.className ?? null,
          chain,
        }
      }, { selector: entry.selector, shellSelector })
      let attribution = '无法解析 / 页面状态不一致'
      if (nodeInfo.found && nodeInfo.componentRoot) attribution = '目标组件 Demo'
      else if (nodeInfo.found && nodeInfo.chain.some((item) =>
        /el-(date|month|year|time|select|cascader|tree-select|tooltip|popper|form-item)/.test(item.className || ''),
      )) {
        attribution = '目标组件的 Element Plus 控件或 Teleport 弹层'
      } else if (nodeInfo.found && nodeInfo.shellRoot) attribution = 'VitePress 文档外壳'
      details.push({
        view: view.id,
        selector: entry.selector,
        rules: entry.row.findings.map((finding) => finding.type),
        attribution,
        node: nodeInfo,
      })
    }
    output.push({
      target: target.target,
      url: target.url,
      httpStatus: response.status(),
      freshContext: true,
      inspectedUnresolvedHits: details.length,
      hits: details,
    })
    await context.close()
  }
} finally {
  await browser.close()
}

await fs.writeFile(
  path.join(outputRoot, 'browser-evidence', 'manual-attribution.json'),
  `${JSON.stringify({ capturedAt: new Date().toISOString(), targets: output }, null, 2)}\n`,
)
