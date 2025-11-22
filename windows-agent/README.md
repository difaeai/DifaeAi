# DIFAE Windows Agent

A lightweight Windows bridge agent that reads a local `agent-config.json` file, connects to the DIFAE backend, opens the RTSP stream with `ffmpeg`, and pushes HLS playlists + TS segments to the bridge upload endpoints. Auto-reconnect/backoff is built in so the stream restarts if RTSP or network connectivity drops.

## Project layout
- `cmd/agent/main.go` — entrypoint that loads configuration and coordinates the RTSP pipeline and uploader.
- `internal/config` — config loader/validator for `agent-config.json`.
- `internal/rtsp` — ffmpeg-based RTSP→HLS pipeline helper.
- `internal/bridge` — uploader that mirrors the existing `bridge-api` protocol (`/api/bridge/upload` + `/api/bridge/upload-file`).

## Configuration file
Place `agent-config.json` next to the compiled `.exe` with the following shape:
```json
{
  "bridgeId": "<bridge-id>",
  "apiKey": "<api-key>",
  "rtspUrl": "rtsp://username:password@host:port/Streaming/Channels/101",
  "backendUrl": "https://api.myapp.com",
  "cameraId": "<camera-id>"
}
```

## Building the Windows executable
1. Install Go (1.21+).
2. From the `windows-agent` directory, run:
   ```bash
   GOOS=windows GOARCH=amd64 go build -o dist/difae-windows-agent.exe ./cmd/agent
   ```
3. Copy `agent-config.json` next to the generated `difae-windows-agent.exe` before running it.
4. Ensure `ffmpeg` is on your `PATH` (the agent shell-executes it to produce HLS segments).

### Running the agent

1. Place `difae-windows-agent.exe` and `agent-config.json` in the same folder.
2. Double-click the executable or run it from a terminal. You should see logs similar to:
   - `Agent started`
   - `Loaded bridge <id>`
   - `Streaming RTSP ... -> backend ...`
   - `Uploaded playlist ... / Uploaded segment ...`
3. The backend will expose the stream at `/api/bridge/stream/<bridgeId>/<cameraId>/playlist.m3u8`.

> **Important:** Do **not** commit compiled binaries to the repository. Build the `.exe` on your own machine following the steps above.
