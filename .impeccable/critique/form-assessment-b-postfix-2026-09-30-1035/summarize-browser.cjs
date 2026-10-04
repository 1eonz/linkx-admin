const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, 'browser');
const views = ['lxform-desktop', 'lxform-mobile', 'lxdynamicform-desktop', 'lxdynamicform-mobile', 'lxdynamicform-hud-dark-reduced-motion'];
const summary = views.map((id) => {
  const evidence = JSON.parse(fs.readFileSync(path.join(root, id, 'evidence.json'), 'utf8'));
  const groups = evidence.detectorFindings ?? [];
  const findings = groups.flatMap((group) => (group.findings ?? []).map((finding) => ({
    selector: group.selector,
    tagName: group.tagName,
    isHidden: group.isHidden,
    isPageLevel: group.isPageLevel,
    type: finding.type,
    category: finding.category,
    severity: finding.severity,
    detail: finding.detail,
    advisory: finding.advisory,
  })));
  const ruleCounts = {};
  for (const finding of findings) ruleCounts[finding.type] = (ruleCounts[finding.type] ?? 0) + 1;
  const consoleSummary = evidence.detectorConsole.map((event) => event.text.replace(/\s+/g, ' '));
  return {
    id,
    url: evidence.url,
    viewport: { width: evidence.view.width, height: evidence.view.height },
    navigationStatus: evidence.navigationStatus,
    overlayInjected: evidence.overlayInjected,
    detectorRawPhase: evidence.detectorRawPhase,
    overlayElementGroupCount: groups.length,
    rawRuleHitCount: findings.length,
    ruleCounts,
    consoleSummary,
    interaction: {
      activeLabel: evidence.interactionState?.activeLabel ?? null,
      invalidItems: evidence.interactionState?.invalidItems ?? [],
      uploadSuccessCount: evidence.uploadState?.reduce((count, item) => count + ((item.itemText.match(/上传成功/g) ?? []).length), 0) ?? 0,
      hudDemoClass: evidence.interactionState?.hudDemoClass ?? null,
      hudThemeChecked: evidence.interactionState?.hudThemeChecked ?? null,
      reducedMotion: evidence.interactionState?.reducedMotion ?? false,
      scrollWidth: evidence.interactionState?.viewport?.scrollWidth ?? null,
    },
    errors: {
      pageErrorCount: evidence.pageErrors.length,
      failedRequestCount: evidence.failedRequests.length,
      badResponseCount: evidence.badResponses.length,
      blockedRequestCount: evidence.blockedRequests.length,
    },
    detectorRawPath: path.relative(root, path.join(root, id, 'detector-raw.json')),
    consolePath: path.relative(root, path.join(root, id, 'console.json')),
    screenshotPath: path.relative(root, path.join(root, id, 'viewport-overlay.png')),
    uploadScreenshotPath: evidence.uploadState ? path.relative(root, path.join(root, id, 'upload-state-overlay.png')) : null,
    findings,
  };
});
fs.writeFileSync(path.join(root, 'detector-findings-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary.map(({ id, overlayElementGroupCount, rawRuleHitCount, ruleCounts, consoleSummary, errors, interaction }) => ({ id, overlayElementGroupCount, rawRuleHitCount, ruleCounts, consoleSummary, errors, interaction })), null, 2));
