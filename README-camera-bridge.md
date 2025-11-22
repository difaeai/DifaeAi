# Universal Camera Bridge Monorepo

This repository hosts a production-ready scaffold for bridging RTSP/ONVIF/P2P camera feeds into WebRTC and HLS playback paths.

## Directory Layout
- `bridge-api/` – Fastify-based control plane with OpenAPI spec.
- `ingest-worker/` – Python FastAPI service orchestrating ffmpeg pipelines.
- `media/` – Janus configuration snippets.
- `edge-capture/` – Windows OBS profile + Linux scrcpy tooling for P2P-only cameras.
- `infra/` – Docker Compose stack, nginx-rtmp config, and development RSA keys.
- `web-demo/` – Static page to test WebRTC/HLS playback.
- `docs/camera-bridge/` – Detailed setup guides, security notes, and troubleshooting.
- `tests/e2e/` – Automated + manual acceptance scripts.

## Getting Started
1. Launch the stack:
   ```bash
   cd infra
   docker compose up --build
   ```
2. Register a device via the Bridge API (`POST /devices`).
3. Start ingest (`POST /devices/{id}/start`).
4. Fetch a playback token (`POST /streams/{id}/token`).
5. Open `http://localhost:5173` and paste the token response to test WebRTC/HLS playback. The demo page now auto-negotiates WebRTC playback via Janus and falls back to HLS if needed.

Environment knobs (see `infra/.env.example`):
- `HLS_BASE_URL` – origin serving HLS playlists (`http://localhost:8080` by default).
- `JANUS_WS_URL` – Janus WebSocket endpoint (`ws://localhost:8188` for local compose).

Refer to `docs/camera-bridge/setup.md` for more details and the P2P playbooks for vendor app capture workflows.

## Operator checklist for the Windows bridge agent

To deploy the DIFAE/BERRETO bridge end-to-end:

1. Build the Windows agent on a Windows machine:
   ```bash
   cd windows-agent
   GOOS=windows GOARCH=amd64 go build -o dist/difae-windows-agent.exe ./cmd/agent
   ```
2. Upload `dist/difae-windows-agent.exe` to your hosting provider (for example, Firebase Storage) and surface it at the URL set in `NEXT_PUBLIC_WINDOWS_AGENT_URL`.
3. In production, users will:
   - Create a bridge from the "Add Connection" flow.
   - Download both `difae-windows-agent.exe` and `agent-config.json`.
   - Place the files in the same folder (the agent creates/uses an `hls` folder alongside).
   - Run the agent; it will stream RTSP → HLS and upload to the backend.
   - Open `/dashboard/bridges/<bridgeId>/view` to confirm the live stream.
