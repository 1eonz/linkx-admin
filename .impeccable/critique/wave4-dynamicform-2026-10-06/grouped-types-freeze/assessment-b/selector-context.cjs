const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const evidenceDir = __dirname;
const views = ['desktop-light', 'dark-hud', 'mobile-375-touch'];

async function main() {
  const browserInstance = await chromium.launch({ headless: true });
  const results = [];
  for (const viewId of views) {
    const viewDir = path.join(evidenceDir, 'browser', viewId);
    const prior = JSON.parse(fs.readFileSync(path.join(viewDir, 'evidence.json'), 'utf8'));
    const context = await browserInstance.newContext(prior.context);
    const page = await context.newPage();
    const response = await page.goto(prior.targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);
    if (viewId === 'dark-hud') {
      const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark') || getComputedStyle(document.documentElement).colorScheme === 'dark');
      if (!isDark) {
        const switches = page.locator('button.VPSwitchAppearance');
        for (let index = 0; index < await switches.count(); index++) {
          const button = switches.nth(index);
          if (await button.isVisible()) { await button.click(); break; }
        }
        await page.waitForTimeout(500);
      }
    }
    const groups = prior.page.detector.findings || [];
    const selectors = groups.map(group => group.selector);
    const nodes = await page.evaluate(selectorsIn => selectorsIn.map(selector => {
      let matches;
      let selectorError = null;
      try { matches = Array.from(document.querySelectorAll(selector)); }
      catch (error) { selectorError = String(error.message || error); matches = []; }
      const describe = node => {
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        return {
          tagName: node.tagName?.toLowerCase() || null,
          id: node.id || null,
          className: typeof node.className === 'string' ? node.className : null,
          role: node.getAttribute?.('role') || null,
          text: (node.innerText || node.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 160) || null,
          visible: style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0,
          rect: rect.toJSON(),
          computed: { color: style.color, backgroundColor: style.backgroundColor, backgroundImage: style.backgroundImage, opacity: style.opacity, overflow: style.overflow },
        };
      };
      const node = matches[0] || null;
      const ancestors = [];
      for (let current = node, depth = 0; current && depth < 7; current = current.parentElement, depth++) ancestors.push(describe(current));
      return { selector, selectorError, matchCount: matches.length, target: node ? describe(node) : null, ancestors };
    }), selectors);
    const selectorContext = {
      view: viewId,
      capturedAt: new Date().toISOString(),
      targetUrl: prior.targetUrl,
      responseStatus: response?.status() ?? null,
      selectorCount: selectors.length,
      contexts: groups.map((group, index) => ({
        selector: group.selector,
        findings: group.findings,
        lookup: nodes[index],
      })),
    };
    fs.writeFileSync(path.join(viewDir, 'selector-context.json'), JSON.stringify(selectorContext, null, 2) + '\n', 'utf8');
    results.push({ view: viewId, selectorCount: selectors.length, matchedCount: nodes.filter(node => node.matchCount > 0).length, missingCount: nodes.filter(node => node.matchCount === 0).length, evidence: `browser/${viewId}/selector-context.json` });
    await context.close();
  }
  await browserInstance.close();
  const summary = { capturedAt: new Date().toISOString(), views: results };
  fs.writeFileSync(path.join(evidenceDir, 'selector-context-summary.json'), JSON.stringify(summary, null, 2) + '\n', 'utf8');
  process.stdout.write(JSON.stringify({ views: results.length, summaryPath: 'selector-context-summary.json' }) + '\n');
}

main().catch(error => {
  process.stderr.write(String(error?.stack || error) + '\n');
  process.exitCode = 1;
});
