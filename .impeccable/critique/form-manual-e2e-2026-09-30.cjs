const fs = require('node:fs/promises')
const path = require('node:path')
const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')

const outputDir = path.join(__dirname, 'form-manual-e2e-2026-09-30')

async function main() {
  await fs.mkdir(outputDir, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  const requests = []
  page.on('request', (request) => requests.push(request.url()))

  try {
    await page.goto('http://127.0.0.1:4177/components/lxdynamicform', {
      waitUntil: 'domcontentloaded',
    })
    await page.getByRole('heading', { name: 'LxDynamicForm 动态表单' }).waitFor()
    await page.getByText('演示设置', { exact: true }).click()

    const form = page.locator('.lx-dynamic-form')
    const countColumns = () =>
      form.evaluate((element) =>
        getComputedStyle(element).gridTemplateColumns.split(/\s+/).filter(Boolean).length,
      )

    const adaptiveColumns = await countColumns()
    if (adaptiveColumns !== 2) throw new Error(`文档容器自适应列数应为 2，实际为 ${adaptiveColumns}`)

    await page.getByRole('button', { name: '3 列' }).click()
    const fixedColumns = await countColumns()
    if (fixedColumns !== 3) throw new Error(`固定三列应显示 3 列，实际为 ${fixedColumns}`)
    await page.getByRole('button', { name: '自适应' }).click()

    const cover = form.locator('.lx-dynamic-form__item').filter({ hasText: '任务封面' })
    const photos = form.locator('.lx-dynamic-form__item').filter({ hasText: '现场图片' })
    await cover.locator('input[type="file"]').setInputFiles({
      name: 'mock-cover.png',
      mimeType: 'image/png',
      buffer: Buffer.from('mock image'),
    })
    await cover.getByText('上传成功', { exact: true }).waitFor()
    await photos.locator('input[type="file"]').setInputFiles([
      { name: '现场补充一.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('mock one') },
      { name: '现场补充二.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('mock two') },
    ])
    await photos.locator('.lx-upload__file').nth(3).waitFor()

    await page.getByRole('button', { name: '提交校验' }).click()
    await page.getByText('请输入任务名称', { exact: true }).waitFor()
    const focusPlaceholder = await page.evaluate(() =>
      document.activeElement?.getAttribute('placeholder'),
    )
    if (focusPlaceholder !== '输入任务名称') {
      throw new Error(`校验失败后应聚焦首个错误字段，实际为 ${focusPlaceholder}`)
    }
    await page.getByPlaceholder('输入任务名称').fill('夜间巡防任务')
    await page.getByRole('button', { name: '提交校验' }).click()
    await page.getByText('表单已校验：夜间巡防任务').waitFor()
    await page.screenshot({ path: path.join(outputDir, 'desktop-1280x800.png'), fullPage: true })

    await page.getByRole('button', { name: '空结果', exact: true }).click()
    await page.getByText('暂无候选人员', { exact: true }).waitFor()
    await page.getByRole('button', { name: '失败', exact: true }).click()
    await page.getByText('候选人员读取失败', { exact: true }).first().waitFor()

    await page.setViewportSize({ width: 375, height: 812 })
    const mobile = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      columns: getComputedStyle(document.querySelector('.lx-dynamic-form')).gridTemplateColumns,
    }))
    if (mobile.document !== mobile.viewport) throw new Error('375px 下页面出现横向溢出')
    if (mobile.columns.split(/\s+/).filter(Boolean).length !== 1) {
      throw new Error(`375px 下应自适应为单列，实际为 ${mobile.columns}`)
    }
    await page.screenshot({ path: path.join(outputDir, 'mobile-375x812.png'), fullPage: true })

    const externalRequests = requests.filter(
      (url) => new URL(url).origin !== 'http://127.0.0.1:4177',
    )
    if (externalRequests.length) throw new Error(`发现非本地请求：${externalRequests.join(', ')}`)

    await fs.writeFile(
      path.join(outputDir, 'result.json'),
      JSON.stringify(
        {
          status: 'passed',
          adaptiveColumns,
          fixedColumns,
          focusPlaceholder,
          mobile,
          externalRequests,
        },
        null,
        2,
      ),
    )
    process.stdout.write('DynamicForm browser verification passed\n')
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`)
  process.exitCode = 1
})
