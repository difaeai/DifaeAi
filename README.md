# Camera Bridge Platform

Securely onboard authorized CCTV/IP cameras, preview streams, and bridge isolated LAN devices to a cloud backend with explicit user consent.

> ⚠️ Only connect to devices you own or have written authorization to access. This project does **not** circumvent vendor authentication. All probes are rate-limited and auditable.

## Monorepo layout

- `backend/` — Express + TypeScript API (`POST /api/camera/probe`, camera registry, auth placeholders)
- `frontend/` — React + Vite onboarding wizard, test-connection UI, HLS preview
- `bridge-agent/` — Python 3.11+ LAN agent that transcodes RTSP→HLS with token pairing
- `infra/` — Docker Compose for local demo (backend, frontend, Postgres, RTSP simulator, bridge agent)
- `tests/` — Cross-package test suites (Vitest + pytest)
- `sample-configs/` — Environment templates, bridge-agent YAML
- `docs/` — Security checklist, architecture notes (see `docs/camera-bridge`)

## Prerequisites

- Node.js 20+
- npm 9+
- Python 3.11+ (for the bridge agent)
- ffmpeg/ffprobe available on `PATH`
- Docker + Docker Compose (for the demo stack)

## Quick start

```bash
# install workspaces
npm install

# run backend and frontend together
npm run dev

# open the onboarding UI
open http://localhost:5173
```

Run pieces individually:

```bash
npm run dev:backend   # http://localhost:4000
npm run dev:frontend  # http://localhost:5173
```

Bridge agent (local machine on same LAN as cameras):

```bash
python -m venv .venv && source .venv/bin/activate
pip install -e bridge-agent[dev]
camera-bridge-agent --config sample-configs/bridge-agent.yaml
```

Environment variables:

- `VITE_BACKEND_URL` — override backend proxy target (default `http://localhost:4000`)
- `VITE_BRIDGE_AGENT_ORIGIN` — origin for the local bridge agent (default `http://localhost:8787`)

## Example flow (with RTSP test source)

```bash
cd infra
docker compose up --build
```

1. Visit `http://localhost:5173` and select camera type.
2. Enter the RTSP simulator IP (`rtsp-simulator` service exposes `rtsp://localhost:8554/mystream`).
3. Click **Test Connection** to call `POST /api/camera/probe`.
4. Select a candidate endpoint and start the bridge agent when prompted.
5. Preview the HLS stream (`/stream/<cameraId>/playlist.m3u8`) in the browser.

Stop the stack with `docker compose down`.

## Automated tests

- Backend unit tests (`/api/camera/probe` candidates):

  ```bash
  npm run test:backend
  ```

- Frontend component tests:

  ```bash
  npm run test:frontend
  ```

- Bridge agent pairing test:

  ```bash
  poetry install --with dev  # or pip install -e bridge-agent[dev]
  pytest bridge-agent/tests
  ```

## Security and privacy guarantees

- Explicit user consent before probing or pulling streams.
- Safe ONVIF/RTSP/MJPEG path list — no brute force attempts.
- Bridge agent pairing uses one-time codes with 10-minute tokens.
- Short-lived ffmpeg probes (`ffprobe`, 3 s timeout) to validate streams.
- Audit hooks ready for backend logging (extend via middleware).
- See `docs/security-checklist.md` for deployment review steps.

## Demo / recording plan

Record a short GIF:

1. Start Docker Compose demo stack.
2. Launch frontend and show onboarding wizard selecting IP camera.
3. Enter RTSP simulator IP, run **Test Connection**, show candidate list.
4. Start bridge agent, refresh preview, and display HLS video.
5. Highlight audit log panel (placeholder) and security notice.

Use a tool like OBS or ScreenToGif to capture the flow (~45 s).
