# DIFAE Windows Agent

A Windows helper that reads `agent-config.json`, opens your local RTSP stream with `ffmpeg`, converts it to HLS, and uploads the playlist + TS segments to the DIFAE backend. When the agent is running, you can view the stream from `/streams/<bridgeId>/index.m3u8`.

## Project layout
- `cmd/agent/main.go` — program entrypoint that starts ffmpeg and coordinates uploads.
- `internal/config` — loads and validates `agent-config.json` next to the executable.
- `internal/logging` — simple logger setup.
- `internal/uploader` — pushes the generated manifest and TS segments to the backend endpoints with retries.
- `internal/api` — small HTTP client used for pairing when no config file exists.

## Configuration + pairing
Place `agent-config.json` next to the compiled `.exe` with this structure (the file is written automatically after pairing):

```json
{
  "bridgeId": "<bridge-id>",
  "apiKey": "<bridge-api-key>",
  "rtspUrl": "rtsp://username:password@host:port/Streaming/Channels/101",
  "backendUrl": "https://api.your-host.com",
  "uploadBaseUrl": "https://api.your-host.com",
  "pollIntervalMs": 5000
}
```

The agent logs messages such as `Agent started`, `Loaded config for bridge <bridgeId>`, and `Connecting to backend <backendUrl>` once the config loads successfully.

## Building the Windows executable (manual step)

Build on your own machine (the backend must not compile binaries at runtime):

```bash
GOOS=windows GOARCH=amd64 go build -o dist/difae-bridge-agent.exe ./cmd/agent
```

Upload the resulting `difae-bridge-agent.exe` to your hosting provider (for example, Firebase Storage) and expose it via the URL defined in `NEXT_PUBLIC_WINDOWS_AGENT_URL`.

Make sure `ffmpeg` is installed and on your `PATH` before running the agent.

## Running

1. Download the latest `difae-bridge-agent.exe` and place it in a folder.
2. Run the executable. If `agent-config.json` is missing or invalid, the agent will prompt:

   ```
   DIFAE Bridge Agent
   Enter pairing code from the web dashboard:
   >
   ```

3. Enter the pairing code shown in the BERRETO/DIFAE dashboard after creating a bridge connection. The agent calls `/api/bridge/pair`, saves the returned `agent-config.json`, and then starts streaming.
4. The agent will:
   - Start ffmpeg with your RTSP URL (`ffmpeg -rtsp_transport tcp -i "<rtspUrl>" -an -c:v copy -f hls -hls_time 2 -hls_list_size 5 -hls_flags delete_segments ./hls/out.m3u8`).
   - Write HLS output under `./hls` next to the executable.
   - Upload `out.m3u8` and each `.ts` file to `/api/bridges/<bridgeId>/upload-manifest` and `/api/bridges/<bridgeId>/upload-segment` with the `X-Bridge-ApiKey` header.
5. Visit `/dashboard/bridges/<bridgeId>/view` to watch the live feed.

> **Important:** Do **not** commit compiled binaries. Build on your Windows machine only.
