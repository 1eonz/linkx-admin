import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(fs.readFileSync(path.join(evidenceDir, 'browser-evidence.json'), 'utf8'));
const summary = [];
const log = [];

for (const scenario of data.scenarios) {
  const groups = new Map();
  const rawEntries = [];
  for (const event of scenario.console.all) {
    if (!event.text.includes('color: oklch') || !event.text.startsWith('%c')) continue;
    const ruleMatch = event.text.match(/^%c([^%]+)%c\s+/);
    if (!ruleMatch) continue;
    const rule = ruleMatch[1];
    const firstStyle = event.text.indexOf(' color: oklch');
    const findingText = event.text.slice(ruleMatch[0].length, firstStyle).trim();
    const targetMatch = event.text.match(/color: inherit (.+)$/);
    const target = targetMatch?.[1]?.trim() ?? '';
    rawEntries.push({ rule, findingText, target });
    const entry = groups.get(rule) ?? { count: 0, findings: new Set(), targets: new Set() };
    entry.count++;
    if (findingText) entry.findings.add(findingText);
    if (target) entry.targets.add(target);
    groups.set(rule, entry);
  }
  const headline = scenario.console.all.find(event => event.text.startsWith('%c[impeccable]'))?.text ?? '';
  const total = Number(headline.match(/(\d+) anti-patterns found/)?.[1] ?? 0);
  const visibleMarkers = scenario.detectorScript.runtimeOverlay.addedNodes.filter(node => node.className.includes('impeccable-visible')).length;
  const overlayClasses = [...new Set(scenario.detectorScript.runtimeOverlay.addedNodes.map(node => node.className).filter(name => name.includes('impeccable')))];
  const grouped = [...groups.entries()].map(([rule, value]) => ({
    rule,
    count: value.count,
    findings: [...value.findings],
    targets: [...value.targets],
  })).sort((a, b) => b.count - a.count || a.rule.localeCompare(b.rule));
  summary.push({
    scenario: scenario.name,
    detectorReportedTotal: total,
    loggedFindingRows: rawEntries.length,
    grouped,
    visibleMarkerRowsInCapturedDom: visibleMarkers,
    overlayClassesObserved: overlayClasses,
    staticViewport: scenario.metrics.beforeOverlay.viewport,
    component: scenario.metrics.beforeOverlay.component,
    theme: scenario.metrics.beforeOverlay.theme,
    focus: scenario.metrics.beforeOverlay.focus,
    keyboard: scenario.targetInfo.keyboard ?? null,
    injection: scenario.mutableInjection,
    screenshotNames: scenario.screenshots.map(item => item.filename),
  });
  log.push(`=== ${scenario.name} ===`);
  log.push(`Console headline: ${headline.replace(/%c/g, '').replace(/ color: oklch.*$/, '')}`);
  log.push(`Logged finding rows: ${rawEntries.length}`);
  for (const item of grouped) {
    log.push(`${item.rule}: ${item.count}`);
    for (const target of item.targets) log.push(`  target: ${target}`);
    for (const finding of item.findings) log.push(`  detail: ${finding}`);
  }
  log.push(`Mutable injection: ${scenario.mutableInjection.successful}; detect.js loaded: ${scenario.detectorScript.loaded}; likely overlay nodes: ${scenario.detectorScript.runtimeOverlay.likelyOverlayCount}; visible marker rows captured: ${visibleMarkers}`);
  log.push(`Viewport: inner ${scenario.metrics.beforeOverlay.viewport.innerWidth}px / scrollWidth ${scenario.metrics.beforeOverlay.viewport.docScrollWidth}px / horizontal overflow ${scenario.metrics.beforeOverlay.viewport.horizontalOverflow}`);
  log.push(`Component: ${JSON.stringify(scenario.metrics.beforeOverlay.component)}`);
  log.push(`Focus: ${JSON.stringify(scenario.metrics.beforeOverlay.focus)}`);
  if (scenario.targetInfo.keyboard) log.push(`Keyboard traversal: ${JSON.stringify(scenario.targetInfo.keyboard)}`);
  log.push(`Console events: ${scenario.console.all.length}; detector-related: ${scenario.console.detectorRelated.length}`);
  log.push('');
}

fs.writeFileSync(path.join(evidenceDir, 'browser-rule-summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(evidenceDir, 'browser-console.log'), `${log.join('\n')}\n`, 'utf8');
process.stdout.write(`${JSON.stringify(summary.map(item => ({scenario:item.scenario,total:item.detectorReportedTotal,loggedRows:item.loggedFindingRows,rules:item.grouped.map(rule=>`${rule.rule}:${rule.count}`),componentVisible:item.component?.inViewport,horizontalOverflow:item.staticViewport.horizontalOverflow,focus:item.focus,keyboard:item.keyboard})),null,2)}\n`);
