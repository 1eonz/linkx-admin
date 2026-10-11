const { chromium } = require('F:/work/lz-ui/node_modules/playwright')
const fs = require('node:fs')
const path = require('node:path')

const base = 'http://127.0.0.1:4177'
const outputDir = path.resolve('F:/work/linkx-admin/.impeccable/critique/metric-section-wave-2026-10-11/assessment-a-recheck')
fs.mkdirSync(outputDir, { recursive: true })

const pages = [
  { key: 'metric', route: '/components/lxmetriccard', selector: '.lx-metric-card' },
  { key: 'section', route: '/components/lxsectiontitle', selector: '.lx-section-title' },
]

async function openTarget(browser, pageInfo, viewport, reducedMotion = 'no-preference') {
  const context = await browser.newContext({ viewport, reducedMotion })
  const page = await context.newPage()
  await page.goto(`${base}${pageInfo.route}`, { waitUntil: 'networkidle' })
  await page.waitForSelector(pageInfo.selector, { state: 'visible', timeout: 15000 })
  await page.waitForTimeout(250)
  return { context, page }
}

async function readPage(page, pageInfo, name) {
  return page.evaluate(({ key, label }) => {
    const q = (selector, root = document) => root.querySelector(selector)
    const qa = (selector, root = document) => [...root.querySelectorAll(selector)]
    const style = (node) => node ? getComputedStyle(node) : null
    const rect = (node) => node ? node.getBoundingClientRect().toJSON() : null
    const roots = qa(key === 'metric' ? '.lx-metric-card' : '.lx-section-title')
    const bodyWidth = document.body.scrollWidth
    const clientWidth = document.documentElement.clientWidth
    const result = {
      key,
      label,
      url: location.href,
      documentDir: document.documentElement.getAttribute('dir') || 'ltr',
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: bodyWidth,
      clientWidth,
      horizontalOverflow: bodyWidth > clientWidth,
      count: roots.length,
      components: roots.slice(0, 8).map((root) => {
        const rootStyle = style(root)
        const heading = q('.lx-section-title__text', root)
        const headingLabel = q('.lx-section-title__label', root)
        const metricLabel = q('.lx-metric-card__label', root)
        const statusText = q('.lx-metric-card__visually-hidden', root)
        const value = q('.lx-metric-card__value', root)
        const progress = q('.lx-metric-card__progress', root)
        const fill = q('.lx-metric-card__progress-value', root)
        return {
          text: (root.innerText || '').trim().slice(0, 360),
          rect: rect(root),
          background: rootStyle?.backgroundColor,
          border: rootStyle?.border,
          radius: rootStyle?.borderRadius,
          shadow: rootStyle?.boxShadow,
          transition: rootStyle?.transition,
          headingTag: heading?.tagName || null,
          headingText: headingLabel?.innerText || null,
          headingLabel: headingLabel ? {
            text: headingLabel.innerText,
            width: rect(headingLabel).width,
            height: rect(headingLabel).height,
            scrollWidth: headingLabel.scrollWidth,
            scrollHeight: headingLabel.scrollHeight,
            whiteSpace: style(headingLabel)?.whiteSpace,
            overflowWrap: style(headingLabel)?.overflowWrap,
            textOverflow: style(headingLabel)?.textOverflow,
          } : null,
          metricLabel: metricLabel?.innerText || null,
          statusAnnouncement: statusText ? {
            text: statusText.textContent.trim(),
            display: style(statusText)?.display,
            visibility: style(statusText)?.visibility,
            clipPath: style(statusText)?.clipPath,
            ariaHidden: statusText.getAttribute('aria-hidden'),
          } : null,
          value: value ? { text: value.innerText, color: style(value)?.color, fontSize: style(value)?.fontSize } : null,
          progress: progress ? {
            role: progress.getAttribute('role'),
            label: progress.getAttribute('aria-label'),
            valueNow: progress.getAttribute('aria-valuenow'),
            valueText: progress.getAttribute('aria-valuetext'),
            transitionDuration: style(fill)?.transitionDuration,
            transformOrigin: style(fill)?.transformOrigin,
            rect: rect(progress),
            fillRect: rect(fill),
          } : null,
        }
      }),
    }
    return result
  }, { key: pageInfo.key, label: name })
}

async function capture(page, pageInfo, name, fileName) {
  const evidence = await readPage(page, pageInfo, name)
  await page.screenshot({ path: path.join(outputDir, fileName), fullPage: true })
  return evidence
}

async function headingLevels(browser) {
  const { context, page } = await openTarget(browser, pages[1], { width: 1280, height: 800 })
  const result = await page.evaluate(async () => {
    const observed = []
    for (const current of [2, 3, 4]) {
      const container = document.querySelector('[data-testid="variant-border"]')
      const heading = container?.querySelector('.lx-section-title__text')
      const instance = heading?.__vueParentComponent
      if (!instance) throw new Error('未能取得 LxSectionTitle 的浏览器组件实例')
      instance.props.headingLevel = current
      await instance.update()
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const rendered = container.querySelector('.lx-section-title__text')
      observed.push({
        requested: current,
        tag: rendered?.tagName || null,
        text: rendered?.querySelector('.lx-section-title__label')?.textContent.trim() || null,
        fontSize: rendered ? getComputedStyle(rendered).fontSize : null,
        note: '仅在隔离浏览器 context 内通过 Vue 组件实例逐个替换 prop 并触发更新；实际页面实例随 context 关闭销毁。',
      })
    }
    return { observed }
  })
  await page.screenshot({ path: path.join(outputDir, 'section-heading-levels.png'), fullPage: true })
  await context.close()
  return result
}

async function keyboardFeedback(browser) {
  const { context, page } = await openTarget(browser, pages[1], { width: 1280, height: 800 })
  const button = page.getByRole('button', { name: '查看', exact: true })
  await button.focus()
  const focus = await page.evaluate(() => {
    const node = document.activeElement
    const style = getComputedStyle(node)
    return {
      tag: node.tagName,
      text: node.innerText.trim(),
      outline: style.outline,
      outlineOffset: style.outlineOffset,
      rect: node.getBoundingClientRect().toJSON(),
    }
  })
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => document.querySelector('.lx-section-title-demo__status')?.textContent.includes('查看辖区协同指挥中心配置详情'))
  const liveFeedback = await page.locator('.lx-section-title-demo__status').evaluate((node) => ({
    text: node.textContent.trim(),
    ariaLive: node.getAttribute('aria-live'),
  }))
  await page.screenshot({ path: path.join(outputDir, 'section-view-keyboard-feedback.png'), fullPage: true })
  await context.close()
  return { focus, liveFeedback, activatedBy: 'Enter' }
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  try {
  const evidence = { generatedAt: new Date().toISOString(), target: 'LxMetricCard + LxSectionTitle', results: [] }

  for (const pageInfo of pages) {
    const scenarios = [
      { name: 'desktop-light', viewport: { width: 1280, height: 800 }, reducedMotion: 'no-preference' },
      { name: 'mobile-320-light', viewport: { width: 320, height: 812 }, reducedMotion: 'no-preference' },
      { name: 'mobile-375-light', viewport: { width: 375, height: 812 }, reducedMotion: 'no-preference' },
      { name: 'desktop-reduced', viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' },
      { name: 'mobile-320-rtl-reduced', viewport: { width: 320, height: 812 }, reducedMotion: 'reduce', rtl: true },
    ]
    for (const scenario of scenarios) {
      const { context, page } = await openTarget(browser, pageInfo, scenario.viewport, scenario.reducedMotion)
      if (scenario.rtl) await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'))
      if (scenario.name === 'desktop-hud') {
        if (pageInfo.key === 'section') await page.getByLabel('HUD 深色主题').check()
        else await page.evaluate(() => document.querySelector('.vp-doc')?.classList.add('lx-theme-hud'))
      }
      await page.waitForTimeout(200)
      const fileName = `${pageInfo.key}-${scenario.name}.png`
      const result = await capture(page, pageInfo, scenario.name, fileName)
      result.reducedMotion = scenario.reducedMotion
      result.rtl = Boolean(scenario.rtl)
      result.screenshot = fileName
      evidence.results.push(result)
      await context.close()
    }

    const { context: hudContext, page: hudPage } = await openTarget(browser, pageInfo, { width: 1280, height: 800 })
    if (pageInfo.key === 'section') await hudPage.getByLabel('HUD 深色主题').check()
    else await hudPage.evaluate(() => document.querySelector('.vp-doc')?.classList.add('lx-theme-hud'))
    await hudPage.waitForTimeout(150)
    const hudFile = `${pageInfo.key}-desktop-hud.png`
    const hud = await capture(hudPage, pageInfo, 'desktop-hud', hudFile)
    hud.screenshot = hudFile
    evidence.results.push(hud)
    await hudContext.close()
  }

  evidence.headingLevels = await headingLevels(browser)
  evidence.keyboardFeedback = await keyboardFeedback(browser)
  fs.writeFileSync(path.join(outputDir, 'browser-evidence.json'), JSON.stringify(evidence, null, 2))
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error.stack || error)
  process.exitCode = 1
})
