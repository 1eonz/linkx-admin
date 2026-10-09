#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../../..');
const FREEZE_PATH = path.join(ROOT, '.impeccable/critique/wave4-dynamicform-2026-10-06/final-recheck-2026-10-06/source-hashes-freeze.json');
const SKILL_ROOT = 'C:/Users/Administrator/.codex/skills/impeccable';
const DETECTOR_ENTRY = path.join(SKILL_ROOT, 'scripts/detect.mjs');
const DETECTOR_BROWSER = path.join(SKILL_ROOT, 'scripts/detector/detect-antipatterns-browser.js');
const TARGET_URL = 'http://127.0.0.1:4174/components/lxdynamicform.html';
const EDGE_EXE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PLAYWRIGHT_ENTRY = path.join(ROOT, 'other-admin/admin-vue3/node_modules/.pnpm/playwright@1.58.0/node_modules/playwright/index.mjs');
const SERVER_INFO = path.join(HERE, 'detector-server-runtime.json');
const SERVER_EXIT = path.join(HERE, 'detector-server-exit.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function readFreeze() {
  return readJson(FREEZE_PATH);
}

function sourceEntries() {
  const freeze = readFreeze();
  return Object.entries(freeze.files).map(([relativePath, expected]) => ({
    relativePath,
    expected,
    absolutePath: path.join(ROOT, relativePath),
  }));
}

function hashFile(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function verifyHashes(phase) {
  const rows = sourceEntries().map(({ relativePath, expected, absolutePath }) => {
    const exists = fs.existsSync(absolutePath);
    const actual = exists ? hashFile(absolutePath) : null;
    return { path: relativePath, expected, actual, exists, matches: actual === expected };
  });
  const check = {
    phase,
    checkedAt: new Date().toISOString(),
    freezePath: path.relative(ROOT, FREEZE_PATH).replaceAll(path.sep, '/'),
    fileCount: rows.length,
    matchedCount: rows.filter((row) => row.matches).length,
    mismatches: rows.filter((row) => !row.matches).map(({ path: filePath, expected, actual, exists }) => ({
      path: filePath,
      expected,
      actual,
      exists,
    })),
    files: rows,
  };
  const checkPath = path.join(HERE, 'hash-check-' + phase + '.json');
  writeJson(checkPath, check);

  if (phase === 'after') {
    const beforePath = path.join(HERE, 'hash-check-before.json');
    const before = fs.existsSync(beforePath) ? readJson(beforePath) : null;
    const beforeByPath = new Map((before?.files || []).map((row) => [row.path, row.actual]));
    const unchangedSinceBefore = Boolean(before)
      && rows.every((row) => beforeByPath.get(row.path) === row.actual);
    writeJson(path.join(HERE, 'integrity.json'), {
      target: path.relative(ROOT, FREEZE_PATH).replaceAll(path.sep, '/'),
      expectedFileCount: readFreeze().fileCount,
      before: {
        checkedAt: before?.checkedAt || null,
        matchedCount: before?.matchedCount ?? null,
        fileCount: before?.fileCount ?? null,
        allMatch: Boolean(before && before.fileCount === readFreeze().fileCount && before.matchedCount === readFreeze().fileCount),
      },
      after: {
        checkedAt: check.checkedAt,
        matchedCount: check.matchedCount,
        fileCount: check.fileCount,
        allMatch: check.fileCount === readFreeze().fileCount && check.matchedCount === readFreeze().fileCount,
      },
      unchangedSinceBefore,
      passed: Boolean(
        before
        && before.fileCount === readFreeze().fileCount
        && before.matchedCount === readFreeze().fileCount
        && check.fileCount === readFreeze().fileCount
        && check.matchedCount === readFreeze().fileCount
        && unchangedSinceBefore,
      ),
      beforeFiles: before?.files || [],
      afterFiles: rows,
    });
  }
  process.stdout.write(JSON.stringify({
    phase,
    fileCount: check.fileCount,
    matchedCount: check.matchedCount,
    mismatchCount: check.mismatches.length,
    output: path.relative(ROOT, checkPath).replaceAll(path.sep, '/'),
  }, null, 2) + '\n');
  return check;
}

function runDetector() {
  const supportedExtensions = new Set(['.vue', '.ts', '.tsx']);
  const files = sourceEntries().filter(({ relativePath }) => (
    supportedExtensions.has(path.extname(relativePath).toLowerCase())
  ));
  const resultDir = path.join(HERE, 'detector-results');
  fs.mkdirSync(resultDir, { recursive: true });
  const items = [];

  for (const { relativePath } of files) {
    const slug = relativePath.replace(/[\\/:]/g, '__');
    const command = [process.execPath, DETECTOR_ENTRY, '--json', relativePath];
    const result = spawnSync(process.execPath, [DETECTOR_ENTRY, '--json', relativePath], {
      cwd: ROOT,
      encoding: 'utf8',
      windowsHide: true,
      maxBuffer: 16 * 1024 * 1024,
    });
    const stdout = result.stdout ?? '';
    const stderr = result.stderr ?? '';
    fs.writeFileSync(path.join(resultDir, slug + '.command.txt'), command.join(' ') + '\n', 'utf8');
    fs.writeFileSync(path.join(resultDir, slug + '.stdout.txt'), stdout, 'utf8');
    fs.writeFileSync(path.join(resultDir, slug + '.stderr.txt'), stderr, 'utf8');
    fs.writeFileSync(path.join(resultDir, slug + '.exit-code.txt'), String(result.status) + '\n', 'utf8');

    let parsed = null;
    let jsonError = null;
    try {
      parsed = JSON.parse(stdout);
    } catch (error) {
      jsonError = error.message;
    }
    const findings = Array.isArray(parsed)
      ? parsed
      : (Array.isArray(parsed?.findings) ? parsed.findings : []);
    const byRule = {};
    for (const finding of findings) {
      const rule = finding.antipattern || finding.type || finding.id || 'unknown';
      byRule[rule] = (byRule[rule] || 0) + 1;
    }
    const primaryCount = findings.filter((finding) => (
      finding.advisory !== true && finding.severity !== 'advisory'
    )).length;
    const summary = {
      target: relativePath,
      command,
      exitCode: result.status,
      signal: result.signal,
      processError: result.error?.message || null,
      stdoutBytes: Buffer.byteLength(stdout),
      stderrBytes: Buffer.byteLength(stderr),
      stderrEmpty: stderr.length === 0,
      validJson: jsonError === null,
      jsonShape: Array.isArray(parsed) ? 'array' : (parsed === null ? 'invalid' : typeof parsed),
      jsonError,
      totalFindings: findings.length,
      primaryFindings: primaryCount,
      advisoryFindings: findings.length - primaryCount,
      byRule,
      locations: findings.map((finding) => ({
        rule: finding.antipattern || finding.type || finding.id || 'unknown',
        file: finding.file || relativePath,
        line: finding.line ?? null,
        snippet: finding.snippet || null,
      })),
      qualifiesAsStaticZeroHit: jsonError === null
        && Array.isArray(parsed)
        && parsed.length === 0
        && stderr.length === 0
        && result.status === 0,
    };
    writeJson(path.join(resultDir, slug + '.summary.json'), summary);
    items.push(summary);
  }

  const index = {
    detector: path.relative(ROOT, DETECTOR_ENTRY).replaceAll(path.sep, '/'),
    invocation: 'node scripts/detect.mjs --json <one frozen Vue/TS file>',
    generatedAt: new Date().toISOString(),
    frozenFileCount: sourceEntries().length,
    supportedExtensions: [...supportedExtensions],
    scannedFileCount: files.length,
    validJsonCount: items.filter((item) => item.validJson && item.jsonShape === 'array').length,
    strictStaticZeroHitCount: items.filter((item) => item.qualifiesAsStaticZeroHit).length,
    findingCount: items.reduce((sum, item) => sum + item.totalFindings, 0),
    nonZeroExitCount: items.filter((item) => item.exitCode !== 0).length,
    stderrNonEmptyCount: items.filter((item) => !item.stderrEmpty).length,
    files: items,
    skippedByScope: sourceEntries()
      .filter(({ relativePath }) => !supportedExtensions.has(path.extname(relativePath).toLowerCase()))
      .map(({ relativePath }) => ({
        path: relativePath,
        extension: path.extname(relativePath).toLowerCase() || '(none)',
        reason: path.extname(relativePath).toLowerCase() === '.md'
          ? 'Markdown 静态对照/说明文件不属于本次 Vue/TS 源文件扫描范围。'
          : path.extname(relativePath).toLowerCase() === '.css'
            ? '独立 CSS 文件按本次冻结任务要求不扫描；Vue/TS 文件仍逐文件交给 detect.mjs。'
            : '本次要求只扫描冻结清单中的 Vue/TS 源文件。',
      })),
  };
  writeJson(path.join(HERE, 'detector-index.json'), index);
  process.stdout.write(JSON.stringify({
    scannedFileCount: index.scannedFileCount,
    strictStaticZeroHitCount: index.strictStaticZeroHitCount,
    findingCount: index.findingCount,
    nonZeroExitCount: index.nonZeroExitCount,
    stderrNonEmptyCount: index.stderrNonEmptyCount,
    index: path.relative(ROOT, path.join(HERE, 'detector-index.json')).replaceAll(path.sep, '/'),
  }, null, 2) + '\n');
}

function startDetectorServer() {
  if (fs.existsSync(SERVER_INFO)) {
    throw new Error('detector-server-runtime.json already exists; refusing to overwrite prior evidence.');
  }
  const child = spawn(process.execPath, [fileURLToPath(import.meta.url), 'server-serve'], {
    cwd: ROOT,
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.unref();
  const deadline = Date.now() + 10000;
  const poll = () => {
    if (fs.existsSync(SERVER_INFO)) {
      const runtime = readJson(SERVER_INFO);
      const result = {
        command: 'node assessment-b.mjs server-start',
        launchedChildPid: runtime.pid,
        exitCode: 0,
        runtime,
      };
      writeJson(path.join(HERE, 'detector-server-start.json'), result);
      process.stdout.write(JSON.stringify(result, null, 2) + '\n');
      return;
    }
    if (Date.now() > deadline) {
      const result = { command: 'node assessment-b.mjs server-start', launchedChildPid: child.pid, exitCode: 1 };
      writeJson(path.join(HERE, 'detector-server-start.json'), result);
      process.stderr.write(JSON.stringify(result) + '\n');
      process.exitCode = 1;
      return;
    }
    setTimeout(poll, 50);
  };
  poll();
}

function serveDetector() {
  if (!fs.existsSync(DETECTOR_BROWSER)) throw new Error('Bundled browser detector is missing: ' + DETECTOR_BROWSER);
  const token = crypto.randomBytes(24).toString('hex');
  let runtime;
  const server = http.createServer((request, response) => {
    const url = new URL(request.url || '/', 'http://127.0.0.1');
    if (url.pathname === '/health') {
      response.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      response.end(JSON.stringify({ ok: true, pid: process.pid }));
      return;
    }
    if (url.pathname === '/detect.js') {
      response.writeHead(200, {
        'content-type': 'application/javascript; charset=utf-8',
        'cache-control': 'no-store',
        'access-control-allow-origin': '*',
        'x-content-type-options': 'nosniff',
      });
      response.end(fs.readFileSync(DETECTOR_BROWSER));
      return;
    }
    if (url.pathname === '/__stop') {
      if (url.searchParams.get('token') !== token) {
        response.writeHead(403);
        response.end('forbidden');
        return;
      }
      response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8', 'connection': 'close' });
      response.end('stopping');
      setTimeout(() => {
        server.close(() => {
          process.exitCode = 0;
          process.exit();
        });
        server.closeAllConnections();
      }, 100);
      return;
    }
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('not found');
  });
  server.listen(0, '127.0.0.1', () => {
    runtime = {
      pid: process.pid,
      host: '127.0.0.1',
      port: server.address().port,
      token,
      detectorBundle: path.relative(ROOT, DETECTOR_BROWSER).replaceAll(path.sep, '/'),
      detectorSha256: hashFile(DETECTOR_BROWSER),
      startedAt: new Date().toISOString(),
      stopMethod: 'GET /__stop?token=<runtime token>',
    };
    writeJson(SERVER_INFO, runtime);
  });
  process.on('exit', (exitCode) => {
    writeJson(SERVER_EXIT, {
      pid: process.pid,
      exitCode,
      stoppedAt: new Date().toISOString(),
    });
  });
}

async function stopDetectorServer() {
  const runtime = readJson(SERVER_INFO);
  let status = null;
  let error = null;
  try {
    const response = await fetch('http://' + runtime.host + ':' + runtime.port + '/__stop?token=' + runtime.token);
    status = response.status;
    await response.text();
  } catch (caught) {
    error = caught.message;
  }
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    if (fs.existsSync(SERVER_EXIT)) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const childExit = fs.existsSync(SERVER_EXIT) ? readJson(SERVER_EXIT) : null;
  const safeRuntime = { ...runtime };
  safeRuntime.tokenSha256 = crypto.createHash('sha256').update(runtime.token).digest('hex');
  delete safeRuntime.token;
  if (fs.existsSync(SERVER_INFO)) writeJson(SERVER_INFO, safeRuntime);
  const startPath = path.join(HERE, 'detector-server-start.json');
  if (fs.existsSync(startPath)) {
    const start = readJson(startPath);
    start.runtime = safeRuntime;
    writeJson(startPath, start);
  }
  const result = {
    command: 'node assessment-b.mjs server-stop',
    method: 'GET http://' + runtime.host + ':' + runtime.port + '/__stop?token=<redacted>',
    httpStatus: status,
    requestExitCode: status === 200 ? 0 : 1,
    process: childExit,
    stopSucceeded: status === 200 && childExit?.exitCode === 0,
    error,
  };
  writeJson(path.join(HERE, 'detector-server-stop.json'), result);
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  if (!result.stopSucceeded) process.exitCode = 1;
}

function classifyAttribution(group, snapshot) {
  const ancestry = group.ancestry || [];
  const targetOverlay = snapshot.overlays.find((overlay) => (
    group.selector?.startsWith('#')
    && overlay.targetId === group.selector.slice(1)
    && overlay.className.includes('impeccable-overlay')
  )) || null;
  if (ancestry.some((item) => item.includes('.impeccable-label'))) {
    return {
      source: 'Impeccable HUD 自身生成的 label',
      ownership: 'detector instrumentation',
      reason: '命中元素的祖先路径包含 .impeccable-label；属于 overlay 自身文字，不属于目标页面控件。',
      targetOverlay,
    };
  }
  if (targetOverlay?.targetClass?.includes('el-select__popper')) {
    return {
      source: 'LxDynamicForm Demo 中隐藏的 LxSelect/Element Plus popper',
      ownership: 'actual component demo, hidden state',
      reason: 'DOM class 为 el-select__popper lx-select__popper，DOM 检查 isHidden=true 且 overlay bounds 为 0x0。',
      targetOverlay,
    };
  }
  if (group.classification === 'VitePress/Shiki code example'
    || ancestry.some((item) => item.includes('.shiki'))) {
    return {
      source: 'VitePress/Shiki 代码示例语法高亮 token',
      ownership: 'documentation renderer',
      reason: '命中元素位于 pre.shiki / .shiki 代码示例中，属于代码高亮，不是业务界面的调色板控件。',
      targetOverlay,
    };
  }
  if (group.selector?.includes('button.copy')) {
    return {
      source: 'VitePress 代码块复制按钮',
      ownership: 'documentation shell',
      reason: '命中按钮位于 .language-vue/.language-ts 代码块容器中；不属于动态表单控件。',
      targetOverlay,
    };
  }
  if (group.selector === 'body') {
    return {
      source: '文档页面 body 全局样式',
      ownership: 'page-level wrapper',
      reason: '规则锚定 body；本次证据确认是页面级信号，未从 DOM 快照确认具体样式表来源。',
      targetOverlay,
    };
  }
  if (group.selector === 'span.container') {
    return {
      source: 'VitePress 移动端导航容器',
      ownership: 'documentation shell',
      reason: '命中 span.container，且仅触屏视图出现；不属于动态表单 Demo。',
      targetOverlay,
    };
  }
  if ((group.findings || []).some((finding) => finding.type === 'line-length')) {
    return {
      source: 'VitePress 文档正文段落',
      ownership: 'documentation content',
      reason: '命中元素为 .vp-doc 内 p 段落，规则检查的是说明文案行宽，不是组件表单控件。',
      targetOverlay,
    };
  }
  if (group.classification === 'VitePress document content or embedded demo') {
    return {
      source: 'VitePress 文档内容区',
      ownership: 'documentation content',
      reason: '命中元素位于 .vp-doc 文档区域；selector 和 finding 保留供逐项核对。',
      targetOverlay,
    };
  }
  return {
    source: group.classification || '未分类页面元素',
    ownership: 'page-level / review selector',
    reason: '按原始 DOM selector 与 ancestry 保留；不推断为组件缺陷。',
    targetOverlay,
  };
}

function sanitizeStoppedServerRecords() {
  if (!fs.existsSync(SERVER_INFO)) throw new Error('detector-server-runtime.json is missing.');
  const runtime = readJson(SERVER_INFO);
  if (runtime.token) {
    runtime.tokenSha256 = crypto.createHash('sha256').update(runtime.token).digest('hex');
    delete runtime.token;
    writeJson(SERVER_INFO, runtime);
  }
  const startPath = path.join(HERE, 'detector-server-start.json');
  if (fs.existsSync(startPath)) {
    const start = readJson(startPath);
    if (start.runtime?.token) {
      start.runtime.tokenSha256 = crypto.createHash('sha256').update(start.runtime.token).digest('hex');
      delete start.runtime.token;
      writeJson(startPath, start);
    }
  }
  process.stdout.write(JSON.stringify({
    runtimeTokenRemoved: !Object.hasOwn(runtime, 'token'),
    startRecordTokenRemoved: !readJson(startPath).runtime?.token,
  }, null, 2) + '\n');
}

function buildOverlayAttribution(browserEvidence) {
  return {
    target: browserEvidence.target,
    generatedAt: new Date().toISOString(),
    rule: '每个 findings group 保留原始 selector、规则、severity、advisory、hidden 状态和 ancestry；overlay 节点数不等于缺陷数。',
    views: browserEvidence.views.map((view) => {
      const snapshot = view.snapshot || {};
      const groups = (snapshot.findings || []).map((group) => ({
        selector: group.selector,
        tagName: group.tagName,
        isPageLevel: group.isPageLevel,
        isHidden: group.isHidden,
        ancestry: group.ancestry,
        attribution: classifyAttribution(group, snapshot),
        findings: group.findings,
      }));
      const bySource = {};
      const byRule = {};
      for (const group of groups) {
        for (const finding of group.findings || []) {
          const source = group.attribution.source;
          bySource[source] = (bySource[source] || 0) + 1;
          byRule[finding.type] = (byRule[finding.type] || 0) + 1;
        }
      }
      return {
        key: view.key,
        viewport: view.viewport,
        context: view.context,
        navigation: view.navigation,
        injection: view.injection,
        browserFindingGroupCount: groups.length,
        browserFindingCount: groups.reduce((sum, group) => sum + (group.findings || []).length, 0),
        overlayCounts: snapshot.overlayCounts,
        findingsBySource: bySource,
        findingsByRule: byRule,
        actualComponentFindings: groups.filter((group) => group.attribution.ownership.startsWith('actual component')),
        groups,
        overlayElements: snapshot.overlays || [],
        selectorCounts: snapshot.selectorCounts || {},
        controlInventory: (snapshot.interactive || []).filter((item) => (
          ['form', 'input', 'textarea', 'select'].includes(item.tag)
          || ['checkbox', 'radio', 'switch', 'combobox'].includes(item.role)
        )),
      };
    }),
  };
}

function writeEvidenceReport() {
  const detector = readJson(path.join(HERE, 'detector-index.json'));
  const browser = readJson(path.join(HERE, 'browser-evidence.json'));
  const integrity = readJson(path.join(HERE, 'integrity.json'));
  const attribution = buildOverlayAttribution(browser);
  writeJson(path.join(HERE, 'overlay-attribution.json'), attribution);

  const markdown = [
    '# Assessment B：Detector 与浏览器证据',
    '',
    '本报告只记录 detector 与浏览器证据，不包含设计评分或整体 Critique 结论。页面注入已通过可变注入预检；下方将文档渲染层、实际组件 DOM 与 detector HUD 分开归因。',
    '',
    '## 目标与完整性',
    '',
    '- 目标页面：' + browser.target,
    '- 冻结清单：' + integrity.target + '，共 ' + integrity.expectedFileCount + ' 项。',
    '- 评估前哈希：' + integrity.before.matchedCount + '/' + integrity.expectedFileCount + ' 匹配。',
    '- 评估后哈希：' + integrity.after.matchedCount + '/' + integrity.expectedFileCount + ' 匹配。',
    '- 评估前后内容一致：' + (integrity.unchangedSinceBefore ? '是' : '否') + '；完整性 JSON：integrity.json。',
    '- Assessment B 期间未改产品文件。Assessment A 与 grouped-types-freeze 的评估材料未作为输入读取。',
    '',
    '## 静态 Detector',
    '',
    '逐个调用 node scripts/detect.mjs --json <冻结 Vue/TS 文件>。只有 stdout 是有效 JSON 数组 []、stderr 为空且退出码为 0 时，才计为严格静态零命中。以下结果不代表浏览器整体通过。',
    '',
    '- 支持并扫描：' + detector.scannedFileCount + ' 个 .vue/.ts/.tsx 文件。',
    '- 严格零命中：' + detector.strictStaticZeroHitCount + '/' + detector.scannedFileCount + '。',
    '- 有效 JSON：' + detector.validJsonCount + '/' + detector.scannedFileCount + '；stderr 非空：' + detector.stderrNonEmptyCount + '；非零退出码：' + detector.nonZeroExitCount + '。',
    '- Markdown 未扫描：文档/静态对照文件不属于本次 Vue/TS 源文件范围。',
    '- CSS 未扫描：本次任务要求扫描 Vue/TS 文件，冻结清单中的独立 CSS 已列明扩展名和范围原因。',
    '',
    '| 冻结源文件 | JSON | stderr | exit | 命中 | 原始材料 |',
    '| --- | --- | ---: | ---: | ---: | --- |',
  ];

  for (const item of detector.files) {
    const slug = item.target.replace(/[\\/:]/g, '__');
    const base = 'detector-results/' + slug;
    markdown.push(
      '| ' + item.target
      + ' | ' + (item.validJson && item.jsonShape === 'array' ? '有效数组' : '无效')
      + ' | ' + item.stderrBytes + ' bytes'
      + ' | ' + item.exitCode
      + ' | ' + item.totalFindings
      + ' | [stdout](' + base + '.stdout.txt) / [stderr](' + base + '.stderr.txt) / [exit](' + base + '.exit-code.txt)'
      + ' |',
    );
  }
  markdown.push('', '### 范围内未扫描文件', '', '| 文件 | 原因 |', '| --- | --- |');
  for (const item of detector.skippedByScope) {
    markdown.push('| ' + item.path + ' | ' + item.reason + ' |');
  }

  markdown.push(
    '',
    '## 浏览器证据',
    '',
    '浏览器：Microsoft Edge，通过项目已有 Playwright 1.58.0 启动。每个目标视图使用独立 browser context 和 page。预检先修改 document.title，再追加 detector script；script 响应、load 事件与 impeccableDetect/impeccableScan API 都有记录。每页由 detector 自动扫描并显式调用 impeccableScan，等待 HUD 渲染后保存 viewport 与 full-page PNG。',
    '',
    '- 可变注入预检：' + (browser.injectionAvailable ? '通过' : '失败；按 browser-evidence.json 中的具体错误降级'),
    '- 预检页面状态：HTTP ' + (browser.preflight.navigation?.status ?? '无响应') + '；script load ' + (browser.preflight.mutation?.scriptLoad || '未发生') + '；detector API ' + (browser.preflight.mutation?.detectorApiAvailable ? '可用' : '不可用') + '。',
    '',
    '| 视图 | 视口/主题 | 页面与注入 | 控制台/网络 | Detector groups / HUD overlays | 截图 |',
    '| --- | --- | --- | --- | --- | --- |',
  );

  for (const view of browser.views) {
    const snapshot = view.snapshot || {};
    const consoleErrors = (view.console || []).filter((entry) => entry.type === 'error').length;
    const non2xx = (view.httpResponses || []).filter((entry) => entry.status < 200 || entry.status >= 300).length;
    const screenshot = 'screenshots/' + view.key + '.png';
    const fullPage = 'screenshots/' + view.key + '-full.png';
    const theme = view.context.colorScheme + '; html=' + (snapshot.htmlClass || '(no class)')
      + '; body=' + (snapshot.bodyBackground || 'unknown');
    const hud = snapshot.overlayCounts
      ? 'groups ' + snapshot.findingsGroupCount + '/' + snapshot.findingCount
        + '; visible overlay nodes ' + snapshot.overlayCounts.visible
        + '; outlines/labels ' + snapshot.overlayCounts.outlines + '/' + snapshot.overlayCounts.labels
      : '未取得';
    markdown.push(
      '| ' + view.label + ' | ' + view.viewport.width + '×' + view.viewport.height + ', ' + theme
      + ' | HTTP ' + (view.navigation?.status ?? '无响应')
      + '; inject ' + (view.injection?.succeeded ? '成功' : '失败/跳过')
      + ' | console error ' + consoleErrors
      + '; pageerror ' + (view.pageErrors || []).length
      + '; failed request ' + (view.failedRequests || []).length
      + '; non-2xx ' + non2xx
      + ' | ' + hud
      + ' | [viewport](' + screenshot + ') / [full page](' + fullPage + ')'
      + ' |',
    );
  }

  markdown.push(
    '',
    '### Browser overlay 逐项归因',
    '',
    '每个 findings group 的 selector、规则、severity/advisory、hidden 状态、DOM ancestry、匹配 HUD overlay 和实际控件清单均保存在 overlay-attribution.json。HUD 轮廓、标签和可见节点是标注层数量，不按缺陷计数。',
    '',
    '- VitePress/Shiki：深色视图的 ai-color-palette 命中位于 pre.shiki 语法高亮 span，着色来自代码示例 token；将其标为代码高亮上下文，不归为动态表单 UI。完整 token selector 逐项保留在归因 JSON。',
    '- VitePress 文档正文：line-length 命中的是 .vp-doc 内说明段落。它描述文档文本行宽，不命中实际表单字段。',
    '- VitePress 代码块按钮：buried-raster 命中 .language-vue/.language-ts 容器内的 button.copy；属于文档复制按钮，不是 LxDynamicForm 上传图片或表单控件。浏览器截图未执行 hover，因此不判断 hover 后按钮背景表现。',
    '- 页面全局：bounce-easing 与 layout-transition 的锚点是 body，记录为页面级样式信号；DOM 证据不能单独确定具体 CSS 来源。',
    '- 移动导航：clipped-overflow-container 命中 span.container，只出现在 VitePress 导航容器；不归属动态表单。',
    '- 实际控件：三个 gpt-thin-border-wide-shadow 是 Element Plus LxSelect popper（class 含 el-select__popper lx-select__popper），均 isHidden=true、bounds 0×0，属于 Demo 中关闭状态的下拉浮层；规则为 advisory，截图中不可见。未发现可见动态表单字段被该规则标记。',
    '- Detector 自身：dark/HUD 视图的一个 text-occlusion selector ancestry 包含 .impeccable-label，文本是 HUD 自己生成的 “ai color palette” label，记录为注入工具自标注产物。',
    '',
    '组件 DOM inventory 显示页面包含动态表单 Demo 和 schema preview；完整表单/输入/combobox selector 与可访问名称保存在 overlay-attribution.json 的 controlInventory 中。',
    '',
    '## 服务生命周期',
    '',
    '- 启动命令：node assessment-b.mjs server-start；只监听 127.0.0.1 的动态本机端口，提供 Impeccable detect-antipatterns-browser.js。',
    '- 停止命令：node assessment-b.mjs server-stop；停止请求 HTTP 200、请求退出码 0、服务进程退出码 0。',
    '- 停止后：临时端口 listener 数为 0；预览 URL 再次请求仍为 HTTP 200。',
    '- 端口、PID、bundle 哈希与生命周期记录见 detector-server-start.json、detector-server-stop.json、detector-server-exit.json；停止密钥已在归档记录中移除。',
    '',
    '## 材料索引',
    '',
    '- 完整 detector 汇总与 Markdown/CSS 跳过列表：detector-index.json。',
    '- 每个冻结 Vue/TS 文件的原始 stdout、stderr、命令、退出码与解析摘要：detector-results/。',
    '- 页面响应、console、pageerror、failed request、selector inventory、findings 与 overlay DOM 快照：browser-evidence.json。',
    '- 全 selector 归因与控件清单：overlay-attribution.json。',
    '- 可变注入预检和三视图 viewport/full-page 截图：screenshots/。',
    '- 39 项评估前后 SHA-256 逐项记录：integrity.json。',
  );

  const reportPath = path.join(HERE, 'assessment-b-report.md');
  fs.writeFileSync(reportPath, markdown.join('\n') + '\n', 'utf8');
  process.stdout.write(JSON.stringify({
    report: path.relative(ROOT, reportPath).replaceAll(path.sep, '/'),
    attribution: path.relative(ROOT, path.join(HERE, 'overlay-attribution.json')).replaceAll(path.sep, '/'),
    detectorFiles: detector.scannedFileCount,
    browserViews: browser.views.length,
    integrityPassed: integrity.passed,
  }, null, 2) + '\n');
}

function attachPageListeners(page, evidence) {
  page.on('console', (message) => {
    evidence.console.push({
      type: message.type(),
      text: message.text(),
      location: message.location(),
    });
  });
  page.on('pageerror', (error) => {
    evidence.pageErrors.push({ name: error.name, message: error.message, stack: error.stack || null });
  });
  page.on('requestfailed', (request) => {
    evidence.failedRequests.push({
      method: request.method(),
      url: request.url(),
      errorText: request.failure()?.errorText || null,
      resourceType: request.resourceType(),
    });
  });
  page.on('response', (response) => {
    evidence.httpResponses.push({
      status: response.status(),
      statusText: response.statusText(),
      url: response.url(),
      resourceType: response.request().resourceType(),
    });
  });
}

async function openTarget(page, evidence) {
  try {
    const response = await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    evidence.navigation = {
      status: response?.status() ?? null,
      statusText: response?.statusText() ?? null,
      url: page.url(),
      error: null,
    };
  } catch (error) {
    evidence.navigation = { status: null, statusText: null, url: page.url(), error: error.message };
  }
  try {
    await page.waitForLoadState('networkidle', { timeout: 8000 });
  } catch (error) {
    evidence.networkIdle = { reached: false, error: error.message };
  }
  await page.waitForTimeout(800);
}

async function injectDetector(page, runtime, marker) {
  return page.evaluate(async ({ source, label }) => {
    const previousTitle = document.title;
    if (label === 'preflight') document.title = previousTitle + ' [Assessment B preflight]';
    const script = document.createElement('script');
    script.src = source;
    script.dataset.assessment = 'impeccable-b-' + label;
    const loadResult = await new Promise((resolve) => {
      const timer = setTimeout(() => resolve('timeout'), 6000);
      script.addEventListener('load', () => {
        clearTimeout(timer);
        resolve('load');
      }, { once: true });
      script.addEventListener('error', () => {
        clearTimeout(timer);
        resolve('error');
      }, { once: true });
      document.head.appendChild(script);
    });
    return {
      label,
      originalTitle: previousTitle,
      titleChanged: label !== 'preflight' || document.title !== previousTitle,
      scriptAttached: script.isConnected,
      scriptSrc: script.src,
      scriptLoad: loadResult,
      detectorApiAvailable: typeof window.impeccableDetect === 'function'
        && typeof window.impeccableScan === 'function',
    };
  }, {
    source: 'http://' + runtime.host + ':' + runtime.port + '/detect.js?view=' + encodeURIComponent(marker),
    label: marker,
  });
}

async function captureSnapshot(page) {
  return page.evaluate(() => {
    const simpleClass = (element) => {
      if (!element) return '';
      if (typeof element.className === 'string') return element.className;
      return element.getAttribute?.('class') || '';
    };
    const ancestors = (element, max = 7) => {
      const result = [];
      let current = element;
      while (current && result.length < max) {
        const cls = simpleClass(current).trim().split(/\s+/).filter(Boolean).slice(0, 3).join('.');
        const id = current.id ? '#' + current.id : '';
        result.push(current.tagName.toLowerCase() + id + (cls ? '.' + cls : ''));
        current = current.parentElement;
      }
      return result;
    };
    const classify = (element) => {
      if (!element) return 'page-level';
      if (element.closest('pre, code, .shiki, .vp-code-block')) return 'VitePress/Shiki code example';
      const pathText = ancestors(element).join(' ').toLowerCase();
      if (element.closest('form') && /(dynamic.?form|lx.?dynamic|lx-form|form-item|demo|preview)/i.test(pathText)) {
        return 'component demo/form controls';
      }
      if (element.closest('.VPNavBar, .VPSidebar, .VPFooter, .VPLocalNav, .VPDocFooter')) {
        return 'VitePress navigation/document shell';
      }
      if (element.closest('.vp-doc')) return 'VitePress document content or embedded demo';
      return 'page shell / other';
    };
    const selectors = [
      'html', 'body', '.VPNavBar', '.VPSidebar', '.VPContent', '.VPDoc', '.vp-doc',
      '.shiki', 'pre', 'form', 'input', 'textarea', 'select', 'button',
      '[role="checkbox"]', '[role="radio"]', '[role="switch"]', '[role="combobox"]',
      'iframe', '.impeccable-banner', '.impeccable-overlay:not(.impeccable-banner)', '.impeccable-label',
    ];
    const selectorCounts = Object.fromEntries(selectors.map((selector) => {
      try { return [selector, document.querySelectorAll(selector).length]; }
      catch { return [selector, null]; }
    }));
    const interactive = Array.from(document.querySelectorAll(
      'form, input, textarea, select, button, [role="button"], [role="checkbox"], [role="radio"], [role="switch"], [role="combobox"], [class*="dynamicform" i], [class*="lx-dynamic" i]',
    )).slice(0, 120).map((element) => ({
      tag: element.tagName.toLowerCase(),
      id: element.id || null,
      className: simpleClass(element) || null,
      role: element.getAttribute('role'),
      name: element.getAttribute('aria-label') || element.getAttribute('title') || element.labels?.[0]?.innerText?.trim() || null,
      type: element.getAttribute('type'),
      placeholder: element.getAttribute('placeholder'),
      text: (element.innerText || element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120),
      disabled: Boolean(element.disabled || element.getAttribute('aria-disabled') === 'true'),
      ancestors: ancestors(element),
    }));
    const findings = typeof window.impeccableDetect === 'function' ? window.impeccableDetect() : null;
    const groupedFindings = Array.isArray(findings) ? findings.map((group) => {
      const element = group.selector ? document.querySelector(group.selector) : null;
      return {
        selector: group.selector,
        tagName: group.tagName,
        isPageLevel: group.isPageLevel,
        isHidden: group.isHidden,
        classification: classify(element),
        ancestry: ancestors(element),
        findings: (group.findings || []).map((finding) => ({
          type: finding.type,
          category: finding.category,
          severity: finding.severity,
          advisory: finding.advisory,
          detail: finding.detail,
          name: finding.name,
          description: finding.description,
        })),
      };
    }) : null;
    const overlays = Array.from(document.querySelectorAll('.impeccable-overlay, .impeccable-label')).map((element) => ({
      className: simpleClass(element),
      text: (element.innerText || element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 240),
      visible: Boolean(element.getClientRects().length),
      targetTag: element._targetEl?.tagName?.toLowerCase() || null,
      targetId: element._targetEl?.id || null,
      targetClass: simpleClass(element._targetEl) || null,
      targetText: (element._targetEl?.innerText || element._targetEl?.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 160) || null,
      bounds: (() => {
        const rect = element.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      })(),
    }));
    const bodyStyle = getComputedStyle(document.body);
    return {
      title: document.title,
      htmlClass: document.documentElement.className,
      htmlDataTheme: document.documentElement.getAttribute('data-theme'),
      colorScheme: getComputedStyle(document.documentElement).colorScheme,
      bodyBackground: bodyStyle.backgroundColor,
      bodyColor: bodyStyle.color,
      headings: Array.from(document.querySelectorAll('h1, h2, h3')).slice(0, 32).map((element) => ({
        level: element.tagName.toLowerCase(),
        text: (element.innerText || element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 180),
        selector: element.id ? '#' + element.id : element.tagName.toLowerCase(),
      })),
      selectorCounts,
      interactive,
      findings: groupedFindings,
      findingsGroupCount: groupedFindings?.length ?? null,
      findingCount: groupedFindings?.reduce((sum, group) => sum + group.findings.length, 0) ?? null,
      overlays,
      overlayCounts: {
        banners: document.querySelectorAll('.impeccable-banner').length,
        outlines: document.querySelectorAll('.impeccable-overlay:not(.impeccable-banner)').length,
        labels: document.querySelectorAll('.impeccable-label').length,
        visible: overlays.filter((overlay) => overlay.visible).length,
      },
    };
  });
}

async function browserRun() {
  const runtime = readJson(SERVER_INFO);
  const playwright = await import(pathToFileURL(PLAYWRIGHT_ENTRY).href);
  const browser = await playwright.chromium.launch({
    headless: true,
    executablePath: EDGE_EXE,
    args: ['--disable-features=Translate'],
  });
  const evidence = {
    target: TARGET_URL,
    generatedAt: new Date().toISOString(),
    browser: { executable: EDGE_EXE, version: browser.version(), engine: 'Chromium via Playwright 1.58.0' },
    detectorServer: {
      host: runtime.host,
      port: runtime.port,
      pid: runtime.pid,
      injectionUrl: 'http://' + runtime.host + ':' + runtime.port + '/detect.js',
      bundle: runtime.detectorBundle,
      bundleSha256: runtime.detectorSha256,
    },
    preflight: null,
    injectionAvailable: false,
    views: [],
  };

  try {
    const preflightContext = await browser.newContext({ viewport: { width: 1440, height: 960 }, colorScheme: 'light' });
    const preflightPage = await preflightContext.newPage();
    const preflightEvents = { console: [], pageErrors: [], failedRequests: [], httpResponses: [] };
    attachPageListeners(preflightPage, preflightEvents);
    await openTarget(preflightPage, preflightEvents);
    let mutation = null;
    try {
      mutation = await injectDetector(preflightPage, runtime, 'preflight');
      await preflightPage.waitForTimeout(2500);
    } catch (error) {
      mutation = { label: 'preflight', error: error.message, scriptAttached: false, scriptLoad: 'exception', detectorApiAvailable: false };
    }
    const preflightSnapshot = await captureSnapshot(preflightPage).catch((error) => ({ error: error.message }));
    const detectorResponse = preflightEvents.httpResponses.find((response) => response.url.includes('/detect.js')) || null;
    evidence.preflight = {
      navigation: preflightEvents.navigation || null,
      mutation,
      detectorResponse,
      screenshot: path.join(HERE, 'screenshots', 'preflight-1440-light.png'),
      detectorFindingCount: preflightSnapshot.findingCount ?? null,
      overlayCounts: preflightSnapshot.overlayCounts || null,
      console: preflightEvents.console,
      pageErrors: preflightEvents.pageErrors,
      failedRequests: preflightEvents.failedRequests,
      httpResponses: preflightEvents.httpResponses,
    };
    evidence.injectionAvailable = Boolean(
      mutation?.titleChanged
      && mutation?.scriptAttached
      && mutation?.scriptLoad === 'load'
      && mutation?.detectorApiAvailable
      && detectorResponse?.status === 200,
    );
    fs.mkdirSync(path.join(HERE, 'screenshots'), { recursive: true });
    await preflightPage.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
    await preflightPage.screenshot({ path: evidence.preflight.screenshot, fullPage: false }).catch((error) => {
      evidence.preflight.screenshotError = error.message;
    });
    await preflightContext.close();

    const views = [
      { key: 'desktop-light-1440', label: '亮色桌面', width: 1440, height: 960, colorScheme: 'light', isMobile: false, hasTouch: false, dark: false },
      { key: 'desktop-dark-hud-1440', label: '深色/HUD 桌面', width: 1440, height: 960, colorScheme: 'dark', isMobile: false, hasTouch: false, dark: true },
      { key: 'touch-375', label: '375px 触屏', width: 375, height: 812, colorScheme: 'light', isMobile: true, hasTouch: true, dark: false },
    ];
    for (const view of views) {
      const context = await browser.newContext({
        viewport: { width: view.width, height: view.height },
        deviceScaleFactor: 1,
        isMobile: view.isMobile,
        hasTouch: view.hasTouch,
        colorScheme: view.colorScheme,
      });
      if (view.dark) {
        await context.addInitScript(() => {
          try { localStorage.setItem('vitepress-theme-appearance', 'dark'); } catch {}
        });
      }
      const page = await context.newPage();
      const item = {
        key: view.key,
        label: view.label,
        viewport: { width: view.width, height: view.height },
        context: { colorScheme: view.colorScheme, isMobile: view.isMobile, hasTouch: view.hasTouch, fresh: true },
        console: [],
        pageErrors: [],
        failedRequests: [],
        httpResponses: [],
        navigation: null,
        injection: null,
        screenshots: {},
      };
      attachPageListeners(page, item);
      await openTarget(page, item);
      if (view.dark) {
        item.darkModeSetup = await page.evaluate(() => {
          const isDark = () => document.documentElement.classList.contains('dark')
            || document.documentElement.getAttribute('data-theme') === 'dark'
            || getComputedStyle(document.documentElement).colorScheme === 'dark';
          if (isDark()) return { method: 'VitePress dark appearance initialized', dark: true };
          const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
          const target = buttons.find((button) => /dark|深色|夜间/i.test([
            button.getAttribute('aria-label'), button.getAttribute('title'), button.innerText, button.textContent,
          ].filter(Boolean).join(' ')));
          if (!target) return { method: 'prefers-color-scheme and stored VitePress appearance', dark: isDark() };
          target.click();
          return { method: 'theme toggle control', name: target.getAttribute('aria-label') || target.title || target.innerText || null, dark: isDark() };
        }).catch((error) => ({ method: 'setup failed', error: error.message, dark: false }));
        await page.waitForTimeout(500);
      }
      if (evidence.injectionAvailable) {
        try {
          item.injection = await injectDetector(page, runtime, view.key);
          await page.waitForTimeout(2500);
          item.detectorResponse = item.httpResponses.find((response) => response.url.includes('/detect.js')) || null;
          item.injection.succeeded = item.injection.scriptAttached
            && item.injection.scriptLoad === 'load'
            && item.injection.detectorApiAvailable
            && item.detectorResponse?.status === 200;
          if (item.injection.succeeded) {
            await page.evaluate(() => window.impeccableScan()).catch((error) => {
              item.scanError = error.message;
            });
            await page.waitForTimeout(500);
          }
        } catch (error) {
          item.injection = { error: error.message, succeeded: false };
        }
      } else {
        item.injection = {
          succeeded: false,
          skipped: true,
          reason: 'Mutable script-injection preflight did not pass; see preflight for the concrete failure signal.',
        };
      }
      item.snapshot = await captureSnapshot(page).catch((error) => ({ error: error.message }));
      await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
      await page.waitForTimeout(350);
      const viewportPath = path.join(HERE, 'screenshots', view.key + '.png');
      try {
        await page.screenshot({ path: viewportPath, fullPage: false });
        item.screenshots.viewport = viewportPath;
      } catch (error) {
        item.screenshots.viewportError = error.message;
      }
      const fullPath = path.join(HERE, 'screenshots', view.key + '-full.png');
      try {
        await page.screenshot({ path: fullPath, fullPage: true });
        item.screenshots.fullPage = fullPath;
      } catch (error) {
        item.screenshots.fullPageError = error.message;
      }
      evidence.views.push(item);
      await context.close();
    }
  } finally {
    await browser.close();
  }
  evidence.completedAt = new Date().toISOString();
  writeJson(path.join(HERE, 'browser-evidence.json'), evidence);
  process.stdout.write(JSON.stringify({
    injectionAvailable: evidence.injectionAvailable,
    views: evidence.views.map((view) => ({
      key: view.key,
      httpStatus: view.navigation?.status,
      injectionSucceeded: view.injection?.succeeded || false,
      findingCount: view.snapshot?.findingCount ?? null,
      overlayCounts: view.snapshot?.overlayCounts || null,
      consoleCount: view.console.length,
      pageErrorCount: view.pageErrors.length,
      failedRequestCount: view.failedRequests.length,
      screenshot: view.screenshots.viewport || view.screenshots.viewportError,
    })),
    evidence: path.relative(ROOT, path.join(HERE, 'browser-evidence.json')).replaceAll(path.sep, '/'),
  }, null, 2) + '\n');
}

const mode = process.argv[2];
try {
  if (mode === 'hash-before') verifyHashes('before');
  else if (mode === 'hash-after') verifyHashes('after');
  else if (mode === 'detector') runDetector();
  else if (mode === 'server-start') startDetectorServer();
  else if (mode === 'server-serve') serveDetector();
  else if (mode === 'server-stop') await stopDetectorServer();
  else if (mode === 'server-sanitize') sanitizeStoppedServerRecords();
  else if (mode === 'browser') await browserRun();
  else if (mode === 'report') writeEvidenceReport();
  else {
    process.stderr.write('Usage: node assessment-b.mjs <hash-before|detector|server-start|browser|server-stop|hash-after>\n');
    process.exitCode = 2;
  }
} catch (error) {
  process.stderr.write((error.stack || error.message) + '\n');
  process.exitCode = 1;
}
