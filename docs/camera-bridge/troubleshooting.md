# Troubleshooting

## No video in WebRTC player
- Ensure Janus container runs with host networking or correct ICE candidates.
- Confirm firewall allows UDP ports 10000-10200 (Janus default).
- Verify playback token scope includes `webrtc`.
- Check that `JANUS_WS_URL` matches the exposed WebSocket endpoint (use `ws://` for local dev without TLS).

## HLS playlist 403
- Check that the token is appended to the `.m3u8` URL as `?token=...`.
- Inspect Bridge API logs to confirm JWT validation succeeded.

## Ingest worker returns 404
- Confirm the device ingest session was started via `/devices/{id}/start`.
- Restart the ingest-worker container to clear stale process state.

## OBS fails to capture vendor app
- Update the window title in `CameraBridge.json` to match the vendor application.
- Disable hardware acceleration in the vendor app if the window remains blank.
