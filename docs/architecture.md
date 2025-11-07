## Architecture Overview

```
┌──────────┐      HTTPS        ┌───────────┐
│ Frontend │ ◄───────────────► │  Backend  │
└──────────┘                   └───────────┘
     ▲                               ▲
     │ WebRTC/HLS (browser)          │ REST + WebSocket
     │                               │
     │               short-lived TLS │
     │                               │
┌────────────┐  LAN  ┌─────────────────────┐
│ Cameras    │◄─────►│ Bridge Agent (HLS)  │
└────────────┘       └─────────────────────┘
```

- **Frontend (React/Vite)** — Guides the user through secure onboarding, discovery, and live preview. Uses Zustand for state and hls.js for playback.
- **Backend (Express/TypeScript)** — Provides REST APIs (`/api/camera/probe`), stores device metadata, coordinates pairing tokens, logs audit trails.
- **Bridge Agent (Python/aiohttp)** — Runs on the user’s LAN, opens RTSP/MJPEG streams, repackages to HLS, and serves segments when authorized with a one-time token.
- **Storage** — PostgreSQL (default) or SQLite for demo. Recording storage is not implemented yet; planned encryption at rest.
- **Discovery** — ONVIF WSDL probe, RTSP path check, optional MJPEG HEAD requests. All probes are rate limited and require consent before widening.

### Data flow

1. User supplies camera IP → backend probes predetermined endpoints → verified candidates returned to the frontend.
2. User selects candidate → frontend requests bridge agent pairing code → backend exchanges one-time code for token.
3. Backend instructs bridge agent to start ffmpeg RTSP→HLS session using the short-lived token.
4. Frontend plays HLS playlist via browser; backend stores audit logs and metadata.

### Security controls

- TLS is required between backend ⇄ bridge agent in production (self-signed certificates optional for demo).
- Tokens expire after 10 minutes; inactive HLS sessions are terminated after 2 minutes.
- All network operations log timestamps, IP, and user ID (hook points in backend).
- Discovery path list is hardcoded and documented; expanding requires explicit user confirmation.
- Bridge agent runs with least privileges and supports subnet allow list (see `sample-configs/bridge-agent.yaml`).
