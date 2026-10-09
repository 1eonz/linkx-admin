import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'

const projectRoot = process.cwd()
const evidenceRoot = path.resolve(
  '.impeccable/critique/wave7-transferpanel-2026-10-07/postfix-review-2026-10-08/assessment-b/browser',
)
const require = createRequire(path.join(projectRoot, 'other-admin/admin-vue3/package.json'))
const { chromium } = require('@playwright/test')
const targets = [
  { id: 'lxtransferpanel', path: '/components/lxtransferpanel.html' },
  { id: 'lxvirtualtree', path: '/components/lxvirtualtree.html' },
]
const viewports = [
  { id: 'desktop-1440x1000', width: 1440, height: 1000 },
  { id: 'mobile-375x812', width: 375, height: 812 },
]
const docsOrigin = process.env.LX_DOCS_ORIGIN || 'http://127.0.0.1:4174'
const mode = process.argv[2]

await fs.mkdir(evidenceRoot, { recursive: true })

function attachPageLogs(page) {
  const consoleMessages = []
  const pageErrors = []
  const failedRequests = []

  page.on('console', async (message) => {
    const args = []
    for (const handle of message.args()) {
      const element = handle.asElement()
      if (element) {
        try {
          args.push(await element.evaluate((node) => {
            const tagName = node.tagName.toLowerCase()
            const classes = Array.from(node.classList)
            const selector = node.id
              ? `#${CSS.escape(node.id)}`
              : `${tagName}${classes.map((name) => `.${CSS.escape(name)}`).join('')}`
            return {
              kind: 'element',
              selector,
              tagName,
              id: node.id,
              className: String(node.className || ''),
              role: node.getAttribute('role'),
              ariaLabel: node.getAttribute('aria-label'),
              text: (node.textContent || '').trim().slice(0, 500),
              outerHTML: node.outerHTML.slice(0, 800),
            }
          }))
        } catch (error) {
          args.push({ kind: 'element', unavailable: error.message })
        }
      } else {
        try {
          args.push(await handle.jsonValue())
        } catch {
          args.push({ kind: 'unavailable' })
        }
      }
    }
    consoleMessages.push({
      type: message.type(),
      text: message.text(),
      location: message.location(),
      args,
    })
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('requestfailed', (request) => {
    failedRequests.push({
      url: request.url(),
      error: request.failure()?.errorText || 'unknown',
    })
  })

  return { consoleMessages, pageErrors, failedRequests }
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

if (mode === 'preflight') {
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  const logs = attachPageLogs(page)
  const url = new URL(targets[0].path, docsOrigin).toString()

  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
  const mutation = await page.evaluate(() => {
    document.title = `[Human] mutation preflight - ${document.title}`
    const script = document.createElement('script')
    script.dataset.assessmentBPreflight = 'true'
    script.textContent = 'window.__assessmentBMutationPreflight = "completed"'
    document.head.append(script)
    return {
      titleChanged: document.title.startsWith('[Human] mutation preflight - '),
      scriptAppended: script.isConnected,
      inlineScriptRan: window.__assessmentBMutationPreflight === 'completed',
      title: document.title,
      url: location.href,
    }
  })

  await writeJson(path.join(evidenceRoot, 'mutation-preflight.json'), {
    browser: 'Microsoft Edge via Playwright channel msedge',
    browserVersion: browser.version(),
    context: 'fresh isolated BrowserContext',
    newPage: true,
    ...mutation,
    console: logs.consoleMessages,
    pageErrors: logs.pageErrors,
    failedRequests: logs.failedRequests,
  })
  await context.close()
  await browser.close()
} else if (mode === 'capture') {
  const detectorUrl = process.env.LX_DETECTOR_URL || process.argv[3]
  if (!detectorUrl) throw new Error('LX_DETECTOR_URL is required in capture mode')
  const captureSuffix = process.argv[4] ? `-${process.argv[4]}` : ''

  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  const session = {
    browser: 'Microsoft Edge via Playwright channel msedge',
    browserVersion: browser.version(),
    contextIsolation: 'fresh isolated BrowserContext for each viewport and target',
    docsOrigin,
    detectorUrl,
    detectorInjectionWaitMs: 2500,
    views: [],
  }

  for (const target of targets) {
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
      })
      const page = await context.newPage()
      const logs = attachPageLogs(page)
      const url = new URL(target.path, docsOrigin).toString()
      const label = `[Human] ${target.id} ${viewport.id}`
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
      await page.evaluate((title) => {
        document.title = title
        window.scrollTo(0, 0)
      }, label)
      await page.addScriptTag({ url: detectorUrl })
      await page.waitForTimeout(2500)

      const runtime = await page.evaluate(() => {
        const nodes = Array.from(
          document.querySelectorAll(
            '.impeccable-overlay, .impeccable-label, .impeccable-tooltip',
          ),
        )
        return {
          title: document.title,
          url: location.href,
          readyState: document.readyState,
          detectorScriptPresent: Array.from(document.scripts).some((script) =>
            script.src.includes('/detect.js'),
          ),
          detectorApiPresent: typeof window.impeccableScan === 'function',
          pageSize: {
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            documentWidth: document.documentElement.scrollWidth,
            documentHeight: document.documentElement.scrollHeight,
          },
          overlayElements: nodes.map((element) => {
            const rect = element.getBoundingClientRect()
            return {
              tagName: element.tagName.toLowerCase(),
              id: element.id,
              className: String(element.className || ''),
              text: (element.textContent || '').trim().slice(0, 500),
              title: element.getAttribute('title'),
              visible: rect.width > 0 && rect.height > 0,
              rect: {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
              },
            }
          }),
        }
      })

      const viewId = `${target.id}-${viewport.id}${captureSuffix}`
      const screenshotPath = path.join(evidenceRoot, `${viewId}-overlay.png`)
      await page.screenshot({ path: screenshotPath, fullPage: false })
      const impeccableMessages = logs.consoleMessages.filter((message) =>
        message.text.toLowerCase().includes('[impeccable]'),
      )
      const result = {
        id: viewId,
        target: target.id,
        url: runtime.url,
        label,
        viewport,
        screenshot: path.basename(screenshotPath),
        runtime,
        consoleSummary: {
          totalMessages: logs.consoleMessages.length,
          impeccableMessages,
          messages: logs.consoleMessages,
          pageErrors: logs.pageErrors,
          failedRequests: logs.failedRequests,
        },
        detectorExecutionConfirmed: impeccableMessages.some((message) =>
          message.text.includes('No anti-patterns found') ||
          message.text.includes('anti-patterns found'),
        ),
      }
      await writeJson(path.join(evidenceRoot, `${viewId}.json`), result)
      session.views.push({
        id: viewId,
        detectorScriptPresent: runtime.detectorScriptPresent,
        detectorApiPresent: runtime.detectorApiPresent,
        detectorExecutionConfirmed: result.detectorExecutionConfirmed,
        overlayElementCount: runtime.overlayElements.length,
        pageErrorCount: logs.pageErrors.length,
        failedRequestCount: logs.failedRequests.length,
        screenshot: path.basename(screenshotPath),
      })
      await context.close()
    }
  }

  await browser.close()
  await writeJson(path.join(evidenceRoot, `session${captureSuffix}.json`), session)
} else {
  throw new Error('Usage: capture-assessment-b.mjs <preflight|capture>')
}
