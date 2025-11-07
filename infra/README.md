# Infrastructure

Local development stack for the Camera Bridge Platform.

## Services

- `postgres` — Device registry / metadata (default credentials in `sample-configs/backend.env.example`)
- `rtsp-simulator` — MediaMTX container exposing a test RTSP stream (`rtsp://localhost:8554/mystream`)
- `backend` — Express REST API (builds from `backend/Dockerfile`)
- `frontend` — Vite preview server serving the onboarding UI
- `bridge-agent` — Python LAN agent running in host networking mode for camera access

## Usage

```bash
cd infra
docker compose up --build
```

Make sure ffmpeg is installed on the host if you plan to access real cameras via the bridge agent.

Environment defaults:

- Backend listens on `http://localhost:4000`
- Frontend available on `http://localhost:5173`
- Bridge agent runs at `http://localhost:8787`

To stop and clean up:

```bash
docker compose down -v
```
