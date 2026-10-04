import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

const evidenceDirectory = resolve(
  process.cwd(),
  '../../.impeccable/critique/wave4-content-2026-09-30',
);

test.describe('lx-ui LxCodeSlot 文档示例', () => {
  test('复制、长内容提示、键盘焦点、HUD 主题和窄屏布局可用', async ({ page }) => {
    mkdirSync(evidenceDirectory, { recursive: true });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async (value: string) => {
            (window as Window & { __copiedText?: string }).__copiedText = value;
          },
        },
      });
    });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 320, height: 760 });
    await page.goto('/components/lxcodeslot');

    await expect(page.getByRole('heading', { name: 'LxCodeSlot 编号代码槽' })).toBeVisible();
    const demo = page.getByRole('region', { name: '代码槽示例' });
    const copyButton = demo.getByRole('button', { name: '点击复制代码' }).first();
    const longCode = demo.locator('.lx-code-slot.is-ellipsis').filter({
      hasText: 'GB28181-P2P-EDGE-NODE-20260930-0001',
    });

    await expect(longCode).toHaveAttribute(
      'title',
      '点击复制：GB28181-P2P-EDGE-NODE-20260930-0001',
    );
    await expect(demo.getByRole('button', { name: '点击复制代码' })).toHaveCount(2);
    await expect(demo.getByText('ZONE-A-07')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

    await page.keyboard.press('Tab');
    await copyButton.focus();
    await expect(copyButton).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(demo.getByRole('status')).toHaveText('已复制：NODE-01');
    await expect(page.locator('.lx-message')).toContainText('已复制');
    expect(
      await page.evaluate(
        () => (window as Window & { __copiedText?: string }).__copiedText,
      ),
    ).toBe('NODE-01');

    const lightBackground = await longCode.evaluate((element) => getComputedStyle(element).backgroundColor);
    await demo.getByRole('checkbox', { name: 'HUD 深色主题' }).check();
    await expect(demo).toHaveClass(/lx-theme-hud/);
    const darkBackground = await longCode.evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(darkBackground).not.toBe(lightBackground);

    const reducedMotion = await copyButton.evaluate((element) => getComputedStyle(element).transitionDuration);
    expect(Number.parseFloat(reducedMotion)).toBeLessThanOrEqual(0.00002);

    const domEvidence = await page.evaluate(() => {
      const code = document.querySelector('.lx-code-slot.is-ellipsis');
      const button = document.querySelector('.lx-code-slot--copyable');
      const demoElement = document.querySelector('.lx-code-slot-demo');
      if (!code || !button || !demoElement) throw new Error('缺少代码槽示例节点');
      const codeBox = code.getBoundingClientRect();
      const buttonStyle = getComputedStyle(button);
      return {
        viewport: { width: innerWidth, scrollWidth: document.documentElement.scrollWidth },
        longContent: {
          text: code.textContent?.trim(),
          title: code.getAttribute('title'),
          bounds: { x: codeBox.x, width: codeBox.width, right: codeBox.right },
        },
        copyButton: {
          title: button.getAttribute('title'),
          outlineWidth: buttonStyle.outlineWidth,
          transitionDuration: buttonStyle.transitionDuration,
        },
        theme: demoElement.classList.contains('lx-theme-hud') ? 'hud' : 'light',
      };
    });
    writeFileSync(
      resolve(evidenceDirectory, 'lxcodeslot-browser-dom.json'),
      JSON.stringify(domEvidence, null, 2),
      'utf8',
    );
    await page.screenshot({
      path: resolve(evidenceDirectory, 'lxcodeslot-320-hud.png'),
      fullPage: true,
    });
  });
});