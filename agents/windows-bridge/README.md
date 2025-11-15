# Difae Windows Bridge Agent

This directory contains a Node.js service template that packages into a single Windows executable. The agent installs itself as
a Windows background service, reads `config.json` for camera credentials and forwards the RTSP stream to the Difae backend.

## Project structure

- `src/` – TypeScript sources.
  - `config.ts` loads configuration from `config.json` with environment variable overrides.
  - `logger.ts` writes log lines to `logs/bridge.log`.
  - `runtime.ts` orchestrates the lifecycle, reconnect/backoff and backend heartbeat.
  - `streaming.ts` currently contains placeholder logic. Replace `startStreaming` with the actual FFmpeg/WebRTC pipeline.
  - `index.ts` installs/starts the Windows service using `node-windows` or runs in foreground mode.
- `dist/` – build output. The API route expects `dist/difae-bridge.exe` to exist so it can be copied into the per-camera zip.

## Prerequisites

Install dependencies in this folder before building:

```bash
npm install
```

### Environment variables

- `BRIDGE_ID`, `RTSP_URL`, `BACKEND_URL` can override values from `config.json` when running the agent manually.
- `WINDOWS_AGENT_BUCKET`, `WINDOWS_AGENT_TEMPLATE_PATH`, `DIFAE_BRIDGE_BACKEND_URL` are consumed by the Next.js API that
  packages the agent (see `src/app/api/ip-camera/windows-agent/README.md`).

## Build steps

1. Compile the TypeScript sources and package them into a Windows executable:

   ```bash
   npm run build
   ```

   The `build` script transpiles into `dist/index.js` and then calls [`pkg`](https://github.com/vercel/pkg) to produce
   `dist/difae-bridge.exe`.

2. Copy the resulting `difae-bridge.exe` next to the generated `config.json` when testing locally, or let the API route zip it
   automatically.

## Running locally

- **First run / installer mode:** double-click `difae-bridge.exe` (or run without arguments). It installs a Windows service
  named `DifaeBridge_<bridgeId>` and then exits.
- **Background service:** Windows Service Manager launches the executable with the `--run-service` flag at boot. The runtime
  reads `config.json`, sends a heartbeat to the Difae backend and keeps the streaming loop alive.
- **Foreground testing:** run `difae-bridge.exe --foreground` (or `npm start` after compiling) to bypass the service logic and
  execute the runtime in the current console window.

## Logs

Log output is written to `logs/bridge.log` in the same directory as the executable/config. The logger falls back to
`console.error` if the file system is unavailable.

## TODO / future work

- Replace the placeholder heartbeat endpoint in `runtime.ts` with the real bridge registration endpoint.
- Implement the actual RTSP ingest/forwarding inside `startStreaming`.
- Harden the installer (signing, versioning, auto-updates) before shipping to customers.
