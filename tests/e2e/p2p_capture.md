# P2P Capture Acceptance Checklist

1. Launch docker compose stack (`docker compose up` in `infra/`).
2. On Windows, extract `edge-capture/windows/CameraBridge-OBS.zip` and run `run-obs.bat <CAMERA_ID>`.
3. In the Bridge API, create a device with `type=p2p` and start ingest targeting `hls`.
4. Confirm `/devices/{id}/status` transitions to `running` and `fps > 0` (simulated metrics until ffmpeg instrumentation is wired).
5. Open the web demo and request a playback token; confirm HLS video tag buffers segments at `https://localhost:8080/hls/<CAMERA_ID>.m3u8`.
6. Stop streaming; ensure webhook `/webhooks/device-offline` receives event from Ingest Worker (manual invocation in dev: `curl -X POST http://localhost:8088/webhooks/device-offline -d '{"deviceId":"<CAMERA_ID>"}'`).
