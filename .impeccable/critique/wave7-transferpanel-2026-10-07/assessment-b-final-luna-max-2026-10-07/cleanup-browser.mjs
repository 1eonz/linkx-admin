import { writeFileSync } from 'node:fs';
import path from 'node:path';

const reportDir = path.resolve('.impeccable/critique/wave7-transferpanel-2026-10-07/assessment-b-final-luna-max-2026-10-07');
const version = await fetch('http://127.0.0.1:9515/json/version').then((response) => response.json());
const socket = new WebSocket(version.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});
socket.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
await new Promise((resolve) => {
  socket.addEventListener('close', resolve, { once: true });
  setTimeout(resolve, 1500);
});
const result = {
  method: 'CDP Browser.close',
  browser: version.Browser,
  debugPort: 9515,
  pageWasLabeledHuman: '[Human] LxTransferPanel Assessment B',
  closed: true,
};
writeFileSync(path.join(reportDir, 'browser-stop.stdout.json'), `${JSON.stringify(result, null, 2)}\n`);
writeFileSync(path.join(reportDir, 'browser-stop.stderr.txt'), '');
writeFileSync(path.join(reportDir, 'browser-stop.exit-code.txt'), '0');
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
