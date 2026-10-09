import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const reportDir = path.resolve('.impeccable/critique/wave7-transferpanel-2026-10-07/assessment-b-final-luna-max-2026-10-07');
const evidence = JSON.parse(readFileSync(path.join(reportDir, 'browser-evidence.json'), 'utf8'));

const views = evidence.views.map((view) => {
  const counts = { demo: {}, docsShell: {} };
  let issueCount = 0;
  for (const group of view.findings || []) {
    const scope = group.insideTransferPanelDemo ? counts.demo : counts.docsShell;
    for (const finding of group.findings || []) {
      const rule = finding.type || finding.id || 'unknown';
      scope[rule] = (scope[rule] || 0) + 1;
      issueCount += 1;
    }
  }
  const consoleGroups = (view.console || [])
    .filter((item) => item.type === 'startGroup')
    .map((item) => Number(item.text.match(/\[impeccable\] (\d+) anti-pattern/)?.[1]))
    .filter(Number.isFinite);
  return {
    name: view.name,
    viewport: view.viewport,
    overlayAvailable: view.available,
    consoleGroupCounts: consoleGroups,
    issueCount,
    demoIssueCount: Object.values(counts.demo).reduce((sum, value) => sum + value, 0),
    docsShellIssueCount: Object.values(counts.docsShell).reduce((sum, value) => sum + value, 0),
    byScopeAndRule: counts,
    horizontalOverflow: view.horizontalOverflow,
    hudTheme: view.hudTheme,
    statusText: view.statusText,
    alertText: view.alertText,
    busy: view.busy,
    selectedCount: view.selectedCount,
    treeCount: view.treeCount,
  };
});

const urls = evidence.network.externalRequests.map((request) => request.url);
const externalHttp = [];
const dataUris = [];
for (const value of urls) {
  try {
    const url = new URL(value);
    if (url.protocol === 'data:') dataUris.push(value);
    else if (['http:', 'https:'].includes(url.protocol)) externalHttp.push(value);
  } catch { /* non-URL entries stay in the raw request log */ }
}

const summary = {
  target: evidence.target,
  injectionPreflight: evidence.injectionPreflight,
  overlayInjection: evidence.overlayInjection,
  views,
  network: {
    totalRequestsObserved: evidence.network.totalRequests,
    externalHttpRequestCount: externalHttp.length,
    externalHttpOrigins: [...new Set(externalHttp.map((value) => new URL(value).origin))],
    inlineDataUriCount: dataUris.length,
    classificationNote: 'The browser collector counted six data: image URLs as external; the preserved candidate list contains only those inline data URIs. No external HTTP(S) origin was recorded.',
  },
  browserLogErrors: evidence.console.logEntries.filter((item) => item.level === 'error'),
  browserConsoleImpeccable: evidence.console.impeccable,
};

writeFileSync(path.join(reportDir, 'browser-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
writeFileSync(path.join(reportDir, 'browser-network-summary.json'), `${JSON.stringify(summary.network, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ views, network: summary.network, browserLogErrors: summary.browserLogErrors }, null, 2)}\n`);
