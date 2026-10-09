const fs = require('node:fs');
const path = require('node:path');

const evidenceDir = __dirname;
const viewIds = ['desktop-light', 'dark-hud', 'mobile-375-touch'];
const perView = [];
const aggregate = new Map();

function contextLabel(lookup, selector) {
  const ancestry = lookup?.ancestors || [];
  const classes = [lookup?.target?.className || '', ...ancestry.map(item => item.className || '')].join(' ');
  if (selector === 'body') return 'docs-runtime-shell';
  if (/\bshiki\b|\bvp-code\b|\blanguage-/.test(classes)) return 'docs-syntax-highlight-or-code';
  if (/\bcopy\b/.test(classes)) return 'docs-code-toolbar';
  if (/\bVPNav|\bVPSidebar|\bVPDoc|vp-doc/.test(classes)) return 'docs-page-shell-or-content';
  return 'component-demo-or-document-content';
}

function ancestryLabel(lookup) {
  return (lookup?.ancestors || [])
    .slice(0, 6)
    .map(item => `${item.tagName || 'unknown'}${item.id ? `#${item.id}` : ''}${item.className ? `.${item.className.trim().split(/\s+/).join('.')}` : ''}`)
    .join(' <- ');
}

for (const viewId of viewIds) {
  const viewDir = path.join(evidenceDir, 'browser', viewId);
  const evidence = JSON.parse(fs.readFileSync(path.join(viewDir, 'evidence.json'), 'utf8'));
  const selectorContext = JSON.parse(fs.readFileSync(path.join(viewDir, 'selector-context.json'), 'utf8'));
  const contextsBySelector = new Map(selectorContext.contexts.map(item => [item.selector, item.lookup]));
  const groups = evidence.page.detector.findings || [];
  const groupsBySelector = new Map(groups.map(group => [group.selector, group]));
  const ruleHistogram = {};
  const attributionGroups = new Map();

  for (const group of groups) {
    const lookup = contextsBySelector.get(group.selector) || null;
    const node = lookup?.target || null;
    const nodeSignature = `${node?.tagName || group.tagName || 'unknown'}${node?.className ? `.${node.className.trim().split(/\s+/).join('.')}` : ''}`;
    const ancestry = ancestryLabel(lookup);
    const scope = contextLabel(lookup, group.selector);
    for (const finding of group.findings || []) {
      ruleHistogram[finding.type] = (ruleHistogram[finding.type] || 0) + 1;
      const key = [finding.type, nodeSignature, ancestry, scope].join('|');
      const current = attributionGroups.get(key) || {
        rule: finding.type,
        ruleName: finding.name,
        targetNode: nodeSignature,
        ancestorChain: ancestry,
        likelyScope: scope,
        count: 0,
        details: [],
        representativeSelectors: [],
        views: [],
      };
      current.count++;
      if (finding.detail && !current.details.includes(finding.detail)) current.details.push(finding.detail);
      if (current.representativeSelectors.length < 8 && !current.representativeSelectors.includes(group.selector)) current.representativeSelectors.push(group.selector);
      if (!current.views.includes(viewId)) current.views.push(viewId);
      attributionGroups.set(key, current);
      const aggregateKey = [finding.type, nodeSignature, ancestry, scope].join('|');
      const total = aggregate.get(aggregateKey) || { ...current, count: 0, representativeSelectors: [], views: [] };
      total.count++;
      if (finding.detail && !total.details.includes(finding.detail)) total.details.push(finding.detail);
      if (total.representativeSelectors.length < 8 && !total.representativeSelectors.includes(group.selector)) total.representativeSelectors.push(group.selector);
      if (!total.views.includes(viewId)) total.views.push(viewId);
      aggregate.set(aggregateKey, total);
    }
  }

  const overlays = (evidence.page.detector.overlays || []).map(overlay => {
    let selector = overlay.targetSelector;
    let mapping = overlay.selectorMatchStatus;
    if (!selector && overlay.className.includes('impeccable-banner')) {
      selector = 'body';
      mapping = 'page-level-banner-to-body-finding-group';
    }
    const findingGroup = selector ? groupsBySelector.get(selector) || null : null;
    const lookup = selector ? contextsBySelector.get(selector) || null : null;
    return {
      overlayIndex: overlay.index,
      label: overlay.text,
      targetSelector: selector,
      targetTagName: overlay.targetTagName || lookup?.target?.tagName || (selector === 'body' ? 'body' : null),
      targetClassName: overlay.targetClassName || lookup?.target?.className || null,
      likelyScope: contextLabel(lookup, selector),
      selectorMatchStatus: mapping,
      visible: overlay.visible,
      overlayRect: overlay.rect,
      targetRect: overlay.targetRect || lookup?.target?.rect || null,
      matchingFindings: findingGroup?.findings || overlay.matchingFindings || [],
      selectorContext: lookup ? { matchCount: lookup.matchCount, ancestors: lookup.ancestors } : null,
    };
  });

  const overlaySelectors = new Set(overlays.map(item => item.targetSelector).filter(Boolean));
  const unmatchedFindingGroups = groups
    .filter(group => !overlaySelectors.has(group.selector))
    .map(group => ({
      selector: group.selector,
      target: contextsBySelector.get(group.selector)?.target || null,
      findings: group.findings,
      note: contextsBySelector.get(group.selector)?.matchCount === 0
        ? 'selector no longer resolves in a clean context; captured detector output may refer to detector-injected overlay UI'
        : 'detector returned a finding group without a corresponding overlay element',
    }));

  perView.push({
    view: viewId,
    label: evidence.label,
    responseStatus: evidence.responseStatus,
    theme: evidence.page.theme,
    viewport: evidence.page.viewport,
    overlayCount: overlays.length,
    matchedOverlayCount: overlays.filter(item => item.targetSelector).length,
    visibleOverlayCount: overlays.filter(item => item.visible).length,
    findingGroupCount: groups.length,
    findingCount: groups.reduce((sum, group) => sum + (group.findings || []).length, 0),
    ruleHistogram,
    overlays,
    unmatchedFindingGroups,
    contextEvidence: `browser/${viewId}/selector-context.json`,
    screenshotEvidence: evidence.screenshots,
  });
}

const output = {
  capturedAt: new Date().toISOString(),
  targetUrl: 'http://127.0.0.1:4174/components/lxdynamicform.html',
  basis: 'Browser detector findings were mapped to each overlay target selector and to fresh-page DOM context; body-level banner is associated with its body finding group.',
  perView,
  groupedAttributions: [...aggregate.values()].sort((a, b) => b.count - a.count || a.rule.localeCompare(b.rule)),
};
fs.writeFileSync(path.join(evidenceDir, 'overlay-attribution.json'), JSON.stringify(output, null, 2) + '\n', 'utf8');
process.stdout.write(JSON.stringify({
  views: perView.map(view => ({ view: view.view, overlays: view.overlayCount, matched: view.matchedOverlayCount, findings: view.findingCount, unmatchedGroups: view.unmatchedFindingGroups.length })),
  groupedAttributions: output.groupedAttributions.length,
  path: 'overlay-attribution.json',
}) + '\n');
