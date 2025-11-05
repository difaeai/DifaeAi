# Universal Camera Bridge

This document outlines architecture and operational guidelines for the camera bridge platform.

## Components
- **Bridge API (Node.js/TypeScript)**: exposes device registry, ingest control, playback token issuance, and discovery endpoints.
- **Ingest Worker (Python)**: manages ffmpeg pipelines for RTSP/ONVIF and coordinates external capture paths.
- **Media Stack (Janus + nginx-rtmp)**: provides WebRTC for low-latency playback and HLS for fallback.
- **Edge Capture**: Windows OBS profile and Linux `scrcpy` scripts to relay vendor-only apps into the bridge.
- **Web Demo**: minimal player demonstrating WebRTC + HLS fallback with tokenized URLs.

## Data Flow
1. Register a device via `/devices` with camera metadata and credentials.
2. Optionally discover ONVIF devices using `/discover/onvif` (returns mocked data in dev).
3. Start ingest with `/devices/{id}/start`. The API delegates to the Ingest Worker which builds ffmpeg commands to push into nginx-rtmp and optionally Janus.
4. The worker streams progress metrics back via `/devices/{id}/metrics`, keeping the control plane updated.
5. Issue playback tokens via `/streams/{id}/token`; clients use Janus for low-latency and HLS as fallback (`JANUS_WS_URL`/`HLS_BASE_URL` configurable).
5. Monitor health via `/health` and `/metrics`. Device heartbeat drops trigger the webhook `/webhooks/device-offline`.

## Security Notes
- JWT tokens default to a 5-minute TTL (configurable via `TOKEN_TTL_SECONDS`).
- RSA keys stored under `infra/keys` are for local development only.
- CORS is restricted via `CORS_ALLOWED_ORIGINS`.
- Replace nginx with a hardened ingress + TLS termination for production deployments.
