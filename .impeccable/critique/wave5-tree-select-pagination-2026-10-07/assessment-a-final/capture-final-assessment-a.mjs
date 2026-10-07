import { fileURLToPath, pathToFileURL } from 'node:url'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'

const outputDirectory = path.dirname(fileURLToPath(import.meta.url))
const playwrightEntry = path.resolve(
  outputDirectory,
  '../../../../other-admin/admin-vue3/node_modules/.pnpm/playwright@1.58.0/node_modules/playwright/index.mjs',
)
const { chromium } = await import(pathToFileURL(playwrightEntry).href)

const baseUrl = 'http://127.0.0.1:4177'
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({ headless: true, executablePath: chromePath })
const evidence = []

const targets = [
  {
    key: 'tree-select',
    route: '/components/lxtreeselect',
    demo: '.lx-tree-select-demo',
    control: '#tree-select-demo-organization',
    hudControl: '.lx-tree-select-demo__settings input[type="checkbox"]',
  },
  {
    key: 'cascader',
    route: '/components/lxcascader',
    demo: '.cascader-demo',
    control: '.cascader-demo .el-input__wrapper',
    hudControl: null,
  },
  {
    key: 'select-pagination',
    route: '/components/lxselectpagination',
    demo: '.lx-select-pagination-demo',
    control: '.lx-select-pagination-demo .el-select__wrapper',
    hudControl: '.lx-select-pagination-demo__theme input[type="checkbox"]',
  },
]

const viewports = [
  { key: 'desktop', width: 1440, height: 960, isMobile: false },
  { key: 'mobile-375', width: 375, height: 812, isMobile: true },
]

const wait = (milliseconds = 240) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds))

const screenshotPath = (name) => path.join(outputDirectory, `${name}.png`)

async function capture(page, name) {
  await page.screenshot({
    path: screenshotPath(name),
    animations: 'disabled',
  })
}

async function openDetails(page, selector) {
  const details = page.locator(selector)
  if (!(await details.evaluate((element) => element.open))) {
    await details.locator('summary').click()
  }
}

async function openControl(page, target) {
  await page.locator(target.control).click({ timeout: 5000 })
  await wait(180)
}

async function enableHud(page, target) {
  if (target.hudControl) {
    if (target.key === 'tree-select') {
      await openDetails(page, '.lx-tree-select-demo__settings')
    }
    await page.locator(target.hudControl).first().check({ force: true })
  } else {
    await page.evaluate(() => {
      document.documentElement.classList.add('dark', 'lx-theme-hud')
    })
  }
  await wait(180)
}

async function measure(page, target, viewport) {
  return page.evaluate(
    ({ demoSelector, controlSelector, key, width, height }) => {
      const styleOf = (element) => {
        if (!element) return null
        const style = getComputedStyle(element)
        return {
          backgroundColor: style.backgroundColor,
          color: style.color,
          borderColor: style.borderColor,
        }
      }
      const demo = document.querySelector(demoSelector)
      const control = document.querySelector(controlSelector)
      const popper = Array.from(
        document.querySelectorAll(
          '.el-select__popper, .el-cascader__dropdown, .el-select-dropdown',
        ),
      ).find((element) => {
        const rect = element.getBoundingClientRect()
        return rect.width > 0 && rect.height > 0
      })
      const popperRect = popper?.getBoundingClientRect()
      const labels = Array.from(
        document.querySelectorAll(
          '.lx-cascader__popper .el-cascader-node__label',
        ),
      )
      return {
        key,
        viewport: { width, height },
        scrollWidth: document.documentElement.scrollWidth,
        horizontalOverflow: document.documentElement.scrollWidth > width,
        rootClasses: Array.from(document.documentElement.classList),
        demo: styleOf(demo),
        heading: styleOf(demo?.querySelector('h2')),
        summary: styleOf(demo?.querySelector('p')),
        trigger: styleOf(
          control?.closest('.el-select__wrapper, .el-input__wrapper') ??
            control,
        ),
        popper: popperRect
          ? {
              x: Math.round(popperRect.x),
              y: Math.round(popperRect.y),
              width: Math.round(popperRect.width),
              height: Math.round(popperRect.height),
              withinViewport:
                popperRect.left >= 0 && popperRect.right <= width,
            }
          : null,
        cascaderLabels: labels.map((label) => {
          const labelStyle = getComputedStyle(label)
          return {
            text: label.textContent?.trim() ?? '',
            clientHeight: label.clientHeight,
            scrollHeight: label.scrollHeight,
            lineHeight: labelStyle.lineHeight,
            whiteSpace: labelStyle.whiteSpace,
            overflowWrap: labelStyle.overflowWrap,
          }
        }),
      }
    },
    {
      demoSelector: target.demo,
      controlSelector: target.control,
      key: target.key,
      width: viewport.width,
      height: viewport.height,
    },
  )
}

async function captureTarget(target, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    isMobile: viewport.isMobile,
    hasTouch: viewport.isMobile,
  })
  const page = await context.newPage()
  const record = {
    target: target.route,
    viewport: viewport.key,
    screenshots: [],
    observations: [],
  }
  evidence.push(record)

  await page.goto(`${baseUrl}${target.route}`, {
    waitUntil: 'domcontentloaded',
    timeout: 15000,
  })
  await page.locator('main').waitFor({ state: 'visible', timeout: 10000 })
  await wait(350)
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark', 'lx-theme-hud')
  })

  record.title = await page.title()
  await page.locator(target.demo).scrollIntoViewIfNeeded()
  await wait(100)
  const lightName = `${target.key}-${viewport.key}-light`
  await capture(page, lightName)
  record.screenshots.push(lightName)
  record.light = await measure(page, target, viewport)

  await openControl(page, target)
  const lightOpenName = `${target.key}-${viewport.key}-light-open`
  await capture(page, lightOpenName)
  record.screenshots.push(lightOpenName)
  record.lightOpen = await measure(page, target, viewport)
  await page.keyboard.press('Escape').catch(() => undefined)

  await enableHud(page, target)
  await page.locator(target.demo).scrollIntoViewIfNeeded()
  const hudName = `${target.key}-${viewport.key}-hud`
  await capture(page, hudName)
  record.screenshots.push(hudName)
  record.hud = await measure(page, target, viewport)

  await openControl(page, target)
  const hudOpenName = `${target.key}-${viewport.key}-hud-open`
  await capture(page, hudOpenName)
  record.screenshots.push(hudOpenName)
  record.hudOpen = await measure(page, target, viewport)
  await page.keyboard.press('Escape').catch(() => undefined)

  if (target.key === 'tree-select') {
    await openDetails(page, '.lx-tree-select-demo__settings')
    await page.getByRole('button', { name: '模拟加载失败' }).click()
    await wait(100)
    const errorName = `${target.key}-${viewport.key}-hud-error`
    await capture(page, errorName)
    record.screenshots.push(errorName)
    record.observations.push(
      (await page.locator('.lx-tree-select__error').innerText()).trim(),
    )
  } else if (target.key === 'cascader') {
    await openDetails(page, '.cascader-demo__settings')
    await page.getByRole('button', { name: '失败', exact: true }).click()
    await openControl(page, target)
    const errorName = `${target.key}-${viewport.key}-hud-error-open`
    await capture(page, errorName)
    record.screenshots.push(errorName)
    record.observations.push(
      (
        await page
          .locator('.lx-cascader__panel-footer, .lx-cascader__feedback')
          .first()
          .innerText()
      ).trim(),
    )
    await page.keyboard.press('Escape').catch(() => undefined)
    await page.getByRole('button', { name: '多选模式', exact: true }).click()
    await wait(100)
    const multipleName = `${target.key}-${viewport.key}-hud-multiple`
    await capture(page, multipleName)
    record.screenshots.push(multipleName)
  } else {
    await page.getByRole('button', { name: '下次请求失败' }).click()
    await page.locator('.lx-select-pagination__search input').fill('孙')
    await wait(550)
    const errorName = `${target.key}-${viewport.key}-hud-error`
    await capture(page, errorName)
    record.screenshots.push(errorName)
    record.observations.push(
      `${(await page.getByTestId('request-count').innerText()).trim()} requests; ${(await page.getByTestId('selected-summary').innerText()).trim()}`,
    )
    await page.keyboard.press('Escape').catch(() => undefined)
    await page.getByRole('button', { name: '显示空结果' }).click()
    await wait(300)
    await openControl(page, target)
    const emptyName = `${target.key}-${viewport.key}-hud-empty-open`
    await capture(page, emptyName)
    record.screenshots.push(emptyName)
    record.emptyOpen = await measure(page, target, viewport)
  }

  await context.close()
}

try {
  for (const target of targets) {
    for (const viewport of viewports) {
      await captureTarget(target, viewport)
    }
  }
} finally {
  await browser.close()
}

await writeFile(
  path.join(outputDirectory, 'browser-evidence.json'),
  `${JSON.stringify(evidence, null, 2)}\n`,
  'utf8',
)
console.log(JSON.stringify(evidence, null, 2))
