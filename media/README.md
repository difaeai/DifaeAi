# Media Layer

This directory contains configuration snippets for the media components that serve WebRTC and HLS streams.

- `janus/janus.plugin.streaming.jcfg` – Enables a default streaming mount. At runtime the Ingest Worker can register dynamic mount-points via the Janus Admin/Streaming APIs.
- Nginx-RTMP configuration is stored in `infra/nginx.conf` to keep the runtime configuration close to the Docker Compose file.

The Docker Compose stack launches the following containers:

1. `media` – nginx-rtmp image exposing RTMP ingest on `1935` and HLS on `8080`.
2. `janus` – Janus WebRTC gateway (WS/WSS). We use host networking in development to simplify ICE.
