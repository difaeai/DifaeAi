# Infrastructure

This folder contains the Docker Compose stack and configuration files required to run the Universal Camera Bridge locally.

## Quick start

```bash
cd infra
cp .env.example .env  # already provided for convenience
# ensure dev.key/dev.pub exist (generated in this repo)
docker compose up --build
```

Services:
- `media`: nginx-rtmp with HLS output.
- `janus`: WebRTC gateway.
- `bridge-api`: Device registry / control plane.
- `ingest-worker`: ffmpeg controller.
- `web-demo`: Static web player.

The JWT key paths are mounted into the API container and referenced via `JWT_PRIVATE_KEY_PATH` / `JWT_PUBLIC_KEY_PATH` environment variables.

Playback endpoints can be customised via:
- `HLS_BASE_URL` – defaults to `http://localhost:8080`.
- `JANUS_WS_URL` – defaults to `ws://localhost:8188`.
