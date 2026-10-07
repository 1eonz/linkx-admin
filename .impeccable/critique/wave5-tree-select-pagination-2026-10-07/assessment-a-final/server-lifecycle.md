Assessment A temporary server lifecycle

- Start command: `pnpm --dir linkx-fe dev --host 127.0.0.1 --port 4177`
- Start process: PID 22932 (with VitePress descendants 25864, 21680, 2360)
- Stop command: `Stop-Process -Id 2360,21680,25864,22932 -Force`
- Stop verification: no remaining listener on `127.0.0.1:4177`; the only matching process reported during verification was the short-lived PowerShell verifier itself.
- Port `4174` was not touched.
