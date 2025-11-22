# DIFAE Windows Agent

A Windows helper that reads `agent-config.json`, opens your local RTSP stream with `ffmpeg`, converts it to HLS, and uploads the playlist + TS segments to the DIFAE backend. When the agent is running, you can view the stream from `/streams/<bridgeId>/index.m3u8`.

## Project layout
- `cmd/agent/main.go` — program entrypoint that starts ffmpeg and coordinates uploads.
- `internal/config` — loads and validates `agent-config.json` next to the executable.
- `internal/logging` — simple logger setup.
- `internal/uploader` — pushes the generated manifest and TS segments to the backend endpoints with retries.

## Configuration file
Place `agent-config.json` next to the compiled `.exe` with this structure:

```json
{
  "bridgeId": "<bridge-id>",
  "apiKey": "<bridge-api-key>",
  "rtspUrl": "rtsp://username:password@host:port/Streaming/Channels/101",
  "backendUrl": "https://api.your-host.com"
}
```

The agent logs `Agent started for bridge <bridgeId>.` once the config loads successfully.

## Building the Windows executable
Build on your own machine (the backend must not compile binaries at runtime):

```bash
GOOS=windows GOARCH=amd64 go build -o dist/difae-agent.exe ./cmd/agent
```

Make sure `ffmpeg` is installed and on your `PATH` before running the agent.

## Running

1. Copy `dist/difae-agent.exe` and `agent-config.json` into the same folder.
2. Double-click the executable or run it from PowerShell/cmd.
3. The agent will:
   - Start ffmpeg with your RTSP URL.
   - Write HLS output under your temp directory.
   - Upload `index.m3u8` and each `.ts` file to `/api/bridge-upload/manifest` and `/api/bridge-upload/segment` with your `X-Bridge-Id` and `X-Bridge-Key` headers.
4. Visit `/streams/<bridgeId>/index.m3u8` (or the React viewer at `/bridges/<bridgeId>/view`) to watch the live feed.

> **Important:** Do **not** commit compiled binaries. Build on your Windows machine only.
