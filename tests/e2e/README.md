# Acceptance Tests

Scripts in this folder assert that both the RTSP ingest flow and P2P capture path are operational end-to-end.

## RTSP Smoke Test (`test_bridge.py`)
1. Starts docker-compose stack.
2. Registers a dummy RTSP device and starts ingest.
3. Pushes synthetic metrics to `/devices/{id}/metrics` (mirroring ingest worker heartbeat) and polls `/devices/{id}/status` until `fps > 0`.
4. Requests playback token and ensures HLS URL includes signed query.

## P2P Capture Test (`p2p_capture.md`)
Manual procedure leveraging the OBS profile and verifying arrival of frames via `/devices/{id}/status` and the web demo.
