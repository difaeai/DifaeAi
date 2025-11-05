# Setup Guide

## Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development of Bridge API)
- Python 3.11+ (for ingest worker development)

## Local stack
```bash
cd infra
docker compose up --build
```

This launches media services, the Bridge API, ingest worker, and the static web demo.

## Register an RTSP camera
```bash
curl -X POST http://localhost:8088/devices \
  -H 'content-type: application/json' \
  -d '{"name":"demo","type":"rtsp","rtspUrl":"rtsp://example.com/live"}'
```

Start ingest:
```bash
curl -X POST http://localhost:8088/devices/<DEVICE_ID>/start \
  -H 'content-type: application/json' \
  -d '{"targets":["webrtc","hls"]}'
```

The ingest worker launches `ffmpeg` to push RTMP into nginx-rtmp and publishes metrics back to the API via `/devices/<DEVICE_ID>/metrics`. When ffmpeg exits unexpectedly the worker notifies `/webhooks/device-offline`.

## Issue token & play
```bash
curl -X POST http://localhost:8088/streams/<DEVICE_ID>/token
```
Use the returned URLs in the web demo (`http://localhost:5173`).

Environment overrides in `.env` control playback URLs:
- `HLS_BASE_URL` (default `http://localhost:8080`)
- `JANUS_WS_URL` (default `ws://localhost:8188`)
