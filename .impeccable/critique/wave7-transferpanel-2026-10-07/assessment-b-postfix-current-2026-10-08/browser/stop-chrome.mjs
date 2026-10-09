const endpoint = process.argv[2] || 'http://127.0.0.1:9222';
const version = await fetch(`${endpoint}/json/version`).then((response) => response.json());
const socket = new WebSocket(version.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let acknowledged = false;
const closed = new Promise((resolve) => socket.addEventListener('close', resolve, { once: true }));
const response = new Promise((resolve) => {
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id === 1) {
      acknowledged = !message.error;
      resolve();
    }
  });
});

socket.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
await Promise.race([Promise.all([response, new Promise((resolve) => setTimeout(resolve, 1500))]), closed]);
socket.close();
process.stdout.write(`${JSON.stringify({ browser: version.Browser, closeCommand: 'Browser.close', acknowledged })}\n`);
