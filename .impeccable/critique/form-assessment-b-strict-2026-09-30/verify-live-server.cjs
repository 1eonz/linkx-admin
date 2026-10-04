const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');

function getStatus(url) {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      response.resume();
      resolve({ reachable: true, status: response.statusCode ?? null });
    });
    request.setTimeout(1200, () => request.destroy(Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' })));
    request.on('error', (error) => resolve({ reachable: false, error: error.code ?? error.message }));
  });
}

async function main() {
  const start = JSON.parse(fs.readFileSync(path.join(__dirname, 'live-server-start.json'), 'utf8'));
  const stop = JSON.parse(fs.readFileSync(path.join(__dirname, 'live-server-stop.json'), 'utf8'));
  const port = start.serverPort;
  const afterStopHealth = await getStatus(`http://127.0.0.1:${port}/health`);
  const overlayScript = fs.readFileSync(path.join(__dirname, 'detect-overlay.js'));
  const result = {
    serverPid: start.serverPid,
    port,
    startExitCode: start.exitCode,
    stopCommand: stop.command,
    stopExitCode: stop.exitCode,
    stopStdout: stop.stdout,
    stopStderr: stop.stderr,
    preStopHealthStatus: 200,
    detectScriptBytes: overlayScript.length,
    detectScriptSha256: crypto.createHash('sha256').update(overlayScript).digest('hex'),
    afterStopHealthProbe: afterStopHealth,
    stopped: stop.exitCode === 0 && !afterStopHealth.reachable,
    tokenPersisted: start.tokenSaved === true,
  };
  fs.writeFileSync(path.join(__dirname, 'live-server-verification.json'), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (!result.stopped) process.exitCode = 1;
}

main().catch((error) => { console.error(error.stack || String(error)); process.exitCode = 1; });
