#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [evidenceDir, edgePath, playwrightRoot] = process.argv.slice(2);
if (!evidenceDir || !edgePath || !playwrightRoot) {
  throw new Error('Usage: trace-transfer-http-errors.mjs <evidence-dir> <edge-exe> <playwright-root>');
}

const { chromium } = await import(
  pathToFileURL(path.join(playwrightRoot, 'node_modules', 'playwright', 'index.mjs')).href,
);
const browser = await chromium.launch({ executablePath: edgePath, headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  colorScheme: 'light',
  reducedMotion: 'reduce',
});
const page = await context.newPage();
const responses = [];
const consoleErrors = [];
const requestFailures = [];

page.on('response', (response) => {
  if (response.status() >= 400) {
    responses.push({
      url: response.url(),
      status: response.status(),
      statusText: response.statusText(),
      resourceType: response.request().resourceType(),
    });
  }
});
page.on('console', (message) => {
  if (message.type() === 'error') {
    consoleErrors.push({ text: message.text(), location: message.location() });
  }
});
page.on('requestfailed', (request) => requestFailures.push({
  url: request.url(),
  error: request.failure()?.errorText ?? null,
}));

try {
  await page.goto('http://127.0.0.1:4174/components/lxtransferpanel', {
    waitUntil: 'domcontentloaded',
    timeout: 45000,
  });
  await page.locator('.transfer-panel-demo').waitFor({ state: 'visible', timeout: 30000 });
  await page.waitForTimeout(1000);
} finally {
  await context.close();
  await browser.close();
}

const trace = {
  createdAt: new Date().toISOString(),
  url: 'http://127.0.0.1:4174/components/lxtransferpanel',
  responsesAtLeast400: responses,
  consoleErrors,
  requestFailures,
};
await fs.writeFile(path.join(evidenceDir, 'transfer-light-network-trace.json'), `${JSON.stringify(trace, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(trace, null, 2));
