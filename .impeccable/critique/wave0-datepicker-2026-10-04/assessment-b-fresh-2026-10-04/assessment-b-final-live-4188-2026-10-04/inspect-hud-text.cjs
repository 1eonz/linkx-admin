const { createRequire } = require('node:module')

const requireFromAdmin = createRequire(
  'F:/work/linkx-admin/other-admin/admin-vue3/package.json',
)
const { chromium } = requireFromAdmin('@playwright/test')

const targetUrl =
  'http://127.0.0.1:4188/components/lxdatepicker.html#%E4%BA%A4%E4%BA%92%E7%A4%BA%E4%BE%8B'
const chromeExe = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const darkDocs = process.argv.includes('--dark')

function contrastRatio(foreground, background) {
  const luminance = (color) => {
    const [red, green, blue] = color.match(/\d+/g).map(Number).map((value) => {
      const channel = value / 255
      return channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue
  }

  const first = luminance(foreground)
  const second = luminance(background)
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

async function main() {
  const browser = await chromium.launch({ executablePath: chromeExe, headless: true })
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      colorScheme: darkDocs ? 'dark' : 'light',
    })
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' })
    const currentDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark'),
    )
    if (currentDark !== darkDocs) {
      await page.locator('.VPSwitchAppearance').first().click()
      await page.waitForFunction(
        (requested) => document.documentElement.classList.contains('dark') === requested,
        darkDocs,
      )
    }
    const hudToggle = page.locator('.lx-date-picker-demo input[type="checkbox"]')
    await hudToggle.check()
    await page.locator('#demo-date-control-start').click()
    await page.locator('.lx-date-picker__popper:visible').waitFor()

    const findings = await page.evaluate(() => {
      const visiblePoppers = Array.from(
        document.querySelectorAll('.lx-date-picker__popper'),
      ).filter((element) => {
        const style = getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          rect.width > 0 &&
          rect.height > 0
        )
      })
      const popper = visiblePoppers[visiblePoppers.length - 1]
      const selectors = {
        popper: '.lx-date-picker__popper',
        monthHeader: '.el-date-range-picker__header',
        weekdayHeader: '.el-date-table th',
        ordinaryDate:
          '.el-date-table td.available:not(.in-range):not(.start-date):not(.end-date) .el-date-table-cell__text',
        inRangeDate: '.el-date-table td.in-range .el-date-table-cell__text',
        selectedDate:
          '.el-date-table td.start-date .el-date-table-cell__text, .el-date-table td.end-date .el-date-table-cell__text',
      }

      const samples = {}
      for (const [name, selector] of Object.entries(selectors)) {
        const elements =
          name === 'popper' ? (popper ? [popper] : []) : Array.from(popper?.querySelectorAll(selector) || [])
        if (elements.length === 0) {
          samples[name] = []
          continue
        }

        samples[name] = elements.slice(0, 8).map((element) => {
          const style = getComputedStyle(element)
          let effectiveBackground = null
          const backgroundChain = []
          for (let current = element; current; current = current.parentElement) {
            const background = getComputedStyle(current).backgroundColor
            backgroundChain.push({
              element: current.tagName.toLowerCase(),
              className: String(current.className || ''),
              background,
            })
            const channels = background.match(/\d+(?:\.\d+)?/g)?.map(Number) || []
            if (channels.length === 3 || (channels.length === 4 && channels[3] > 0)) {
              effectiveBackground = background
              break
            }
            if (current === popper) break
          }

          return {
            text: element.textContent.trim(),
            className: String(element.className || ''),
            cellClassName: element.closest('td')?.className || '',
            color: style.color,
            effectiveBackground,
            backgroundChain,
          }
        })
      }
      return {
        visiblePoppers: visiblePoppers.length,
        popperClass: String(popper?.className || ''),
        samples,
      }
    })

    for (const samples of Object.values(findings.samples)) {
      for (const sample of samples) {
        if (sample?.effectiveBackground) {
          sample.contrast = contrastRatio(sample.color, sample.effectiveBackground)
        }
      }
    }
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n')
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  process.stderr.write((error.stack || error.message) + '\n')
  process.exitCode = 1
})
