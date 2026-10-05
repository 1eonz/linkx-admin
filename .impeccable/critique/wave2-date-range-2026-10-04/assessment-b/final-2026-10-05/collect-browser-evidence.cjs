const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");

const requireApp = createRequire("F:/work/linkx-admin/other-admin/admin-vue3/package.json");
const { chromium } = requireApp("@playwright/test");

const evidenceDir = "F:/work/linkx-admin/.impeccable/critique/wave2-date-range-2026-10-04/assessment-b/final-2026-10-05";
const targetUrl = "http://127.0.0.1:5179/components/lxdatepicker";
const edgePath = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";

function round(value) {
  return Math.round(value * 10) / 10;
}

async function readMetrics(page, preferredSelector) {
  return page.evaluate((selector) => {
    const activePoppers = [...document.querySelectorAll(".lx-date-picker__popper")].filter(
      (element) => element.getAttribute("aria-hidden") === "false",
    );
    const popper = document.querySelector(selector) || activePoppers[0] || null;
    const calendar = popper?.querySelector(".el-picker-panel__body") || null;
    const tables = [...(popper?.querySelectorAll(".el-date-table") || [])];
    const table = tables.at(-1);
    const rows = [...(table?.querySelectorAll("tbody tr") || [])];
    const lastRow = rows.at(-1) || null;
    const rect = (element) => {
      if (!element) return null;
      const bounds = element.getBoundingClientRect();
      return {
        top: Math.round(bounds.top * 10) / 10,
        right: Math.round(bounds.right * 10) / 10,
        bottom: Math.round(bounds.bottom * 10) / 10,
        left: Math.round(bounds.left * 10) / 10,
        width: Math.round(bounds.width * 10) / 10,
        height: Math.round(bounds.height * 10) / 10,
      };
    };
    const overflow = (element) => {
      if (!element) return null;
      const style = getComputedStyle(element);
      return {
        x: style.overflowX,
        y: style.overflowY,
        scrollTop: element.scrollTop,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
      };
    };
    const shortcutNames = ["今日", "本周", "近30天"];
    const buttons = [...(popper?.querySelectorAll("button") || [])]
      .filter((button) => shortcutNames.includes(button.textContent.trim()))
      .map((button) => {
        const bounds = rect(button);
        const visible = getComputedStyle(button).visibility !== "hidden" &&
          getComputedStyle(button).display !== "none";
        return {
          text: button.textContent.trim(),
          visible,
          inViewport: visible && bounds.top >= 0 && bounds.left >= 0 &&
            bounds.bottom <= innerHeight && bounds.right <= innerWidth,
          rect: bounds,
        };
      });
    const lastRect = rect(lastRow);
    const popperRect = rect(popper);
    const calendarRect = rect(calendar);
    const lastRowVisible = !!lastRect && lastRect.top >= 0 && lastRect.bottom <= innerHeight;
    const trigger = document.querySelector(
      popper?.classList.contains("lx-date-picker-demo__shortcuts-popper")
        ? "#demo-date-analysis-start"
        : "#demo-date-control-start",
    );
    return {
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      page: {
        scrollY,
        scrollTop: document.scrollingElement?.scrollTop ?? null,
        maxScrollY: Math.max(0, (document.scrollingElement?.scrollHeight || 0) - innerHeight),
      },
      trigger: rect(trigger),
      popper: popper ? {
        className: String(popper.className),
        ariaHidden: popper.getAttribute("aria-hidden"),
        rect: popperRect,
        edgeMargins: popperRect ? {
          top: Math.round(popperRect.top * 10) / 10,
          right: Math.round((innerWidth - popperRect.right) * 10) / 10,
          bottom: Math.round((innerHeight - popperRect.bottom) * 10) / 10,
          left: Math.round(popperRect.left * 10) / 10,
        } : null,
        overflow: overflow(popper),
      } : null,
      calendar: calendar ? {
        className: String(calendar.className),
        rect: calendarRect,
        overflow: overflow(calendar),
      } : null,
      dateTableCount: tables.length,
      rowCountInLastTable: rows.length,
      shortcutButtons: buttons,
      allShortcutButtonsInitiallyVisible: buttons.length === 3 && buttons.every((button) => button.inViewport),
      lastRow: {
        rect: lastRect,
        fullyInViewport: lastRowVisible,
        visibleHeight: lastRect ? Math.max(0, Math.min(lastRect.bottom, innerHeight) - Math.max(lastRect.top, 0)) : 0,
      },
    };
  }, preferredSelector);
}

async function openPicker(page, viewport, inputSelector, preferredPopper, screenshotName) {
  await page.keyboard.press("Escape").catch(() => {});
  await page.setViewportSize(viewport);
  await page.evaluate(() => window.scrollTo(0, 0));
  const before = await page.evaluate((selector) => {
    const input = document.querySelector(selector);
    const bounds = input?.getBoundingClientRect();
    return {
      scrollY,
      scrollTop: document.scrollingElement?.scrollTop ?? null,
      trigger: bounds ? { top: bounds.top, bottom: bounds.bottom, left: bounds.left, right: bounds.right } : null,
    };
  }, inputSelector);
  await page.locator(inputSelector).click();
  await page.waitForTimeout(500);
  const opened = await readMetrics(page, preferredPopper);
  const screenshotPath = path.join(evidenceDir, screenshotName);
  await page.screenshot({ path: screenshotPath, fullPage: false, animations: "disabled" });
  return { before, opened, screenshot: screenshotPath };
}

async function wheelTowardLastRow(page, preferredPopper) {
  const steps = [];
  for (let index = 0; index < 4; index += 1) {
    const before = await readMetrics(page, preferredPopper);
    if (before.lastRow.fullyInViewport) break;
    const calendar = before.calendar?.rect;
    if (!calendar) break;
    const x = Math.max(1, Math.min(before.viewport.width - 1, calendar.left + calendar.width / 2));
    const y = Math.max(1, Math.min(before.viewport.height - 1, calendar.top + calendar.height / 2));
    await page.mouse.move(x, y);
    await page.mouse.wheel(0, 620);
    await page.waitForTimeout(250);
    const after = await readMetrics(page, preferredPopper);
    steps.push({ input: { type: "mouse.wheel", deltaX: 0, deltaY: 620, pointer: { x, y } }, before, after });
  }
  return { steps, final: await readMetrics(page, preferredPopper) };
}

async function main() {
  fs.mkdirSync(evidenceDir, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: edgePath });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const evidence = {
    method: "全新 Playwright browser context + Microsoft Edge",
    targetUrl,
    screenshots: [],
    requests: [],
    responses: [],
    requestFailures: [],
    console: [],
    pageErrors: [],
  };
  page.on("request", (request) => evidence.requests.push({ url: request.url(), method: request.method(), resourceType: request.resourceType() }));
  page.on("response", (response) => evidence.responses.push({ url: response.url(), status: response.status(), resourceType: response.request().resourceType() }));
  page.on("requestfailed", (request) => evidence.requestFailures.push({ url: request.url(), error: request.failure()?.errorText || null }));
  page.on("console", (message) => evidence.console.push({ type: message.type(), text: message.text(), location: message.location() }));
  page.on("pageerror", (error) => evidence.pageErrors.push(error.stack || error.message));

  await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 30000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  evidence.desktop = await openPicker(
    page,
    { width: 1280, height: 720 },
    "#demo-date-control-start",
    ".lx-date-picker__popper[aria-hidden='false']",
    "desktop-1280x720-range.png",
  );

  const shortcutsPopper = ".lx-date-picker-demo__shortcuts-popper.lx-date-picker__popper[aria-hidden='false']";
  evidence.mobile = await openPicker(
    page,
    { width: 375, height: 812 },
    "#demo-date-analysis-start",
    shortcutsPopper,
    "mobile-375x812-shortcuts.png",
  );
  evidence.mobile.wheelToLastRow = await wheelTowardLastRow(page, shortcutsPopper);
  const mobileAfterWheelPath = path.join(evidenceDir, "mobile-375x812-shortcuts-after-wheel.png");
  await page.screenshot({ path: mobileAfterWheelPath, fullPage: false, animations: "disabled" });
  evidence.screenshots.push(evidence.desktop.screenshot, evidence.mobile.screenshot, mobileAfterWheelPath);

  evidence.landscape = await openPicker(
    page,
    { width: 390, height: 375 },
    "#demo-date-analysis-start",
    shortcutsPopper,
    "landscape-390x375-shortcuts.png",
  );
  evidence.landscape.wheelToLastRow = await wheelTowardLastRow(page, shortcutsPopper);
  const landscapeAfterWheelPath = path.join(evidenceDir, "landscape-390x375-shortcuts-after-wheel.png");
  await page.screenshot({ path: landscapeAfterWheelPath, fullPage: false, animations: "disabled" });
  evidence.screenshots.push(evidence.landscape.screenshot, landscapeAfterWheelPath);

  await page.keyboard.press("Escape").catch(() => {});
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.evaluate(() => window.scrollTo(0, 0));
  evidence.overlay = await page.evaluate(async (src) => {
    const script = document.createElement("script");
    script.src = src;
    const loaded = await new Promise((resolve) => {
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.append(script);
    });
    return { loaded, src: script.src };
  }, "http://localhost:8400/detect.js");
  await page.waitForTimeout(2500);
  evidence.overlay.runtime = await page.evaluate(() => ({
    detectorReady: typeof window.impeccableScan === "function",
    overlays: [...document.querySelectorAll(".impeccable-overlay, .impeccable-label, .impeccable-banner, .impeccable-tooltip")]
      .map((element) => ({ tag: element.tagName, className: String(element.className), text: element.textContent.trim().slice(0, 160) })),
    scriptPresent: [...document.scripts].some((script) => script.src === "http://localhost:8400/detect.js"),
  }));
  evidence.overlay.console = evidence.console.filter((entry) => entry.text.toLowerCase().includes("impeccable"));
  evidence.overlay.serverStopMethod = "node \"C:\\Users\\Administrator\\.codex\\skills\\impeccable\\scripts\\live-server.mjs\" stop --keep-inject";
  await fs.promises.writeFile(path.join(evidenceDir, "browser-console-network.json"), JSON.stringify(evidence, null, 2), "utf8");
  await browser.close();
  process.stdout.write(JSON.stringify({
    desktop: evidence.desktop.opened,
    mobile: { opened: evidence.mobile.opened, afterWheel: evidence.mobile.wheelToLastRow.final },
    landscape: { opened: evidence.landscape.opened, wheelSteps: evidence.landscape.wheelToLastRow.steps.map((step) => ({ input: step.input, before: { page: step.before.page, popper: step.before.popper?.rect, calendarScrollTop: step.before.calendar?.overflow.scrollTop, lastRow: step.before.lastRow }, after: { page: step.after.page, popper: step.after.popper?.rect, calendarScrollTop: step.after.calendar?.overflow.scrollTop, lastRow: step.after.lastRow } })), final: evidence.landscape.wheelToLastRow.final },
    overlay: evidence.overlay,
    console: evidence.console,
    pageErrors: evidence.pageErrors,
    requestFailures: evidence.requestFailures,
    responses: evidence.responses,
    screenshots: evidence.screenshots,
    jsonPath: path.join(evidenceDir, "browser-console-network.json"),
  }));
}

main().catch((error) => {
  process.stderr.write((error.stack || error.message || String(error)) + "\n");
  process.exitCode = 1;
});
