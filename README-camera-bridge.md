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
