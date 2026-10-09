import { createRequire } from 'node:module'
import { writeFile } from 'node:fs/promises'

const require = createRequire(
  'F:/work/linkx-admin/other-admin/admin-vue3/package.json',
)
const { chromium } = require('@playwright/test')

const outputDir =
  'F:/work/linkx-admin/.impeccable/critique/wave4-dynamicform-2026-10-07/this-turn-assessment-a'
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
})
const context = await browser.newContext({
  viewport: { width: 375, height: 812 },
  screen: { width: 375, height: 812 },
  isMobile: true,
  hasTouch: true,
  reducedMotion: 'reduce',
  colorScheme: 'light',
  deviceScaleFactor: 1,
})
const page = await context.newPage()
const pageErrors = []
page.on('pageerror', (error) => pageErrors.push(error.message))

try {
  const response = await page.goto(
    'http://127.0.0.1:4174/components/lxdynamicform.html',
    { waitUntil: 'networkidle' },
  )
  await page.getByPlaceholder('输入任务名称').scrollIntoViewIfNeeded()
  await page.screenshot({
    path: `${outputDir}/followup-mobile-375-placeholder.png`,
  })

  const placeholderEvidence = await page.evaluate(() => {
    const luminance = (channel) => {
      const value = channel / 255
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    }
    const parseColor = (value) => {
      const channels = value.match(/[\d.]+/g)?.map(Number)
      if (!channels || channels.length < 3) return null
      const alpha = channels.length > 3 ? channels[3] : 1
      return channels.slice(0, 3).map((channel) => channel * alpha + 255 * (1 - alpha))
    }
    const contrast = (foreground, background) => {
      const fg = parseColor(foreground)
      const bg = parseColor(background)
      if (!fg || !bg) return null
      const fgLuminance = fg.reduce((sum, value, index) => {
        return sum + [0.2126, 0.7152, 0.0722][index] * luminance(value)
      }, 0)
      const bgLuminance = bg.reduce((sum, value, index) => {
        return sum + [0.2126, 0.7152, 0.0722][index] * luminance(value)
      }, 0)
      return Number(
        ((Math.max(fgLuminance, bgLuminance) + 0.05) /
          (Math.min(fgLuminance, bgLuminance) + 0.05)).toFixed(2),
      )
    }
    const effectiveBackground = (element) => {
      const ancestors = []
      for (let current = element; current; current = current.parentElement) {
        ancestors.push(current)
      }
      return ancestors.reverse().reduce((background, current) => {
        const channels = getComputedStyle(current).backgroundColor
          .match(/[\d.]+/g)
          ?.map(Number)
        if (!channels || channels.length < 3) return background
        const alpha = channels.length > 3 ? channels[3] : 1
        return channels
          .slice(0, 3)
          .map((channel, index) => channel * alpha + background[index] * (1 - alpha))
      }, [255, 255, 255])
    }
    const candidates = [...document.querySelectorAll('input[placeholder], textarea[placeholder]')]
    return candidates
      .filter((element) => {
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden'
      })
      .slice(0, 5)
      .map((element) => {
        const style = getComputedStyle(element)
        const placeholder = getComputedStyle(element, '::placeholder')
        const backgroundColor = effectiveBackground(element)
          .map((channel) => Math.round(channel))
        const background = `rgb(${backgroundColor.join(', ')})`
        return {
          placeholder: element.getAttribute('placeholder'),
          foreground: placeholder.color,
          background,
          elementBackground: style.backgroundColor,
          contrast: contrast(placeholder.color, background),
          rect: {
            x: Math.round(element.getBoundingClientRect().x),
            y: Math.round(element.getBoundingClientRect().y),
            width: Math.round(element.getBoundingClientRect().width),
            height: Math.round(element.getBoundingClientRect().height),
          },
        }
      })
  })

  const uploadInput = page.locator('.lx-upload__trigger input[type="file"]').first()
  await uploadInput.setInputFiles({
    name: 'followup-mobile-proof.png',
    mimeType: 'image/png',
    buffer: Buffer.from('in-memory-upload-proof'),
  })
  const progressPanel = page.locator('.lx-upload__panel').first()
  await progressPanel.waitFor({ state: 'visible', timeout: 5000 })
  await progressPanel.scrollIntoViewIfNeeded()
  await page.screenshot({
    path: `${outputDir}/followup-mobile-375-upload-progress.png`,
  })

  const panelEvidence = await page.evaluate(() => {
    const panel = document.querySelector('.lx-upload__panel')
    const button = panel?.querySelector('.lx-upload__cancel')
    const trigger = panel?.closest('.lx-upload__trigger')
    const dragger = trigger?.querySelector('.el-upload-dragger')
    if (!panel || !button || !dragger) return null
    const rect = (element) => {
      const box = element.getBoundingClientRect()
      return {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        top: box.top,
        right: box.right,
        bottom: box.bottom,
        left: box.left,
      }
    }
    const buttonBox = button.getBoundingClientRect()
    const draggerBox = dragger.getBoundingClientRect()
    const viewportIntersection = {
      left: Math.max(0, buttonBox.left),
      top: Math.max(0, buttonBox.top),
      right: Math.min(innerWidth, buttonBox.right),
      bottom: Math.min(innerHeight, buttonBox.bottom),
    }
    const draggerIntersection = {
      left: Math.max(draggerBox.left, buttonBox.left),
      top: Math.max(draggerBox.top, buttonBox.top),
      right: Math.min(draggerBox.right, buttonBox.right),
      bottom: Math.min(draggerBox.bottom, buttonBox.bottom),
    }
    const viewportWidth = Math.max(0, viewportIntersection.right - viewportIntersection.left)
    const viewportHeight = Math.max(0, viewportIntersection.bottom - viewportIntersection.top)
    const draggerWidth = Math.max(0, draggerIntersection.right - draggerIntersection.left)
    const draggerHeight = Math.max(0, draggerIntersection.bottom - draggerIntersection.top)
    return {
      panel: rect(panel),
      button: rect(button),
      dragger: rect(dragger),
      buttonStyle: {
        minHeight: getComputedStyle(button).minHeight,
        overflow: getComputedStyle(dragger).overflow,
      },
      viewportIntersection: { width: viewportWidth, height: viewportHeight },
      draggerIntersection: { width: draggerWidth, height: draggerHeight },
      clippedByDragger: draggerHeight < buttonBox.height,
      centerHitTarget: (() => {
        const element = document.elementFromPoint(
          buttonBox.left + buttonBox.width / 2,
          buttonBox.top + buttonBox.height / 2,
        )
        return Boolean(element && (element === button || button.contains(element)))
      })(),
    }
  })

  const cancelButton = progressPanel.getByRole('button', { name: '取消上传' })
  await cancelButton.click()
  await page.getByText('已取消上传，文件已回到队列').waitFor({
    state: 'attached',
    timeout: 3000,
  })
  await page.screenshot({
    path: `${outputDir}/followup-mobile-375-upload-cancelled.png`,
  })

  const evidence = {
        url: page.url(),
        status: response?.status(),
        viewport: page.viewportSize(),
        deviceScaleFactor: 1,
        colorScheme: 'light',
        reducedMotion: 'reduce',
        placeholderEvidence,
        panelEvidence,
        cancelActionSucceeded: true,
        pageErrors,
        screenshots: [
          'followup-mobile-375-placeholder.png',
          'followup-mobile-375-upload-progress.png',
          'followup-mobile-375-upload-cancelled.png',
        ],
      }
  const serializedEvidence = JSON.stringify(evidence, null, 2)
  await writeFile(`${outputDir}/followup-mobile-evidence.json`, serializedEvidence)
  console.log(serializedEvidence)
} finally {
  await context.close()
  await browser.close()
}
