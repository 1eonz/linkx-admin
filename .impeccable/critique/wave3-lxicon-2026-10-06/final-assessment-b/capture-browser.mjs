import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(directory, 'browser-evidence.mjs');
const url = 'http://127.0.0.1:4174/components/lxicons.html';
const detectorBase = 'http://127.0.0.1:8493';
const command = `node "${path.relative(process.cwd(), script)}" "${url}" "${detectorBase}"`;
const encoding = 'utf8';

await fs.writeFile(path.join(directory, 'browser-capture.command.txt'), command, encoding);
const result = spawnSync(process.execPath, [script, url, detectorBase], {
  cwd: process.cwd(),
  encoding,
  maxBuffer: 20 * 1024 * 1024,
  windowsHide: true,
});
const stdout = result.stdout ?? '';
const stderr = result.stderr ?? '';
const exitCode = result.status ?? 1;

await fs.writeFile(path.join(directory, 'browser-capture.stdout.json'), stdout, encoding);
await fs.writeFile(path.join(directory, 'browser-capture.stderr.txt'), stderr, encoding);
await fs.writeFile(path.join(directory, 'browser-capture.exit-code.txt'), String(exitCode), encoding);

if (result.error) await fs.writeFile(path.join(directory, 'browser-capture.error.txt'), result.error.stack || result.error.message, encoding);
if (result.signal) await fs.writeFile(path.join(directory, 'browser-capture.signal.txt'), result.signal, encoding);

if (stdout) {
  try {
    const evidence = JSON.parse(stdout);
    process.stdout.write(JSON.stringify({
      exitCode,
      noOverlayWidths: evidence.noOverlayWidths,
      overlayRuns: evidence.overlayRuns?.map((run) => ({
        variant: run.variant,
        loaded: run.injected?.loaded,
        beforeWidth: run.beforeOverlay?.documentElementScrollWidth,
        afterWidth: run.afterOverlay?.documentElementScrollWidth,
        consoleMessageCount: run.consoleMessages?.length ?? 0,
      })),
      pageErrors: evidence.pageErrors,
    }, null, 2) + '\n');
  } catch {
    process.stdout.write(JSON.stringify({ exitCode, stdoutCharacters: stdout.length, stderr }) + '\n');
  }
} else {
  process.stdout.write(JSON.stringify({ exitCode, stdoutCharacters: 0, stderr }) + '\n');
}

process.exitCode = exitCode;
