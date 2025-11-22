# DIFAE Windows Agent

A lightweight Windows bridge agent that reads a local `agent-config.json` file, connects to the DIFAE backend, opens the RTSP stream, and forwards frames from a local network camera.

## Project layout
- `cmd/agent/main.go` — entrypoint that loads configuration and coordinates the RTSP client and uploader.
- `internal/config` — config loader/validator for `agent-config.json`.
- `internal/rtsp` — stub RTSP client that emits dummy frames (replace with a real RTSP implementation as needed).
- `internal/bridge` — placeholder uploader that would send frames to the backend.

## Configuration file
Place `agent-config.json` next to the compiled `.exe` with the following shape:
```json
{
  "bridgeId": "<bridge-id>",
  "apiKey": "<api-key>",
  "rtspUrl": "rtsp://username:password@host:port/Streaming/Channels/101",
  "backendUrl": "https://api.myapp.com"
}
```

## Building the Windows executable
1. Install Go (1.21+).
2. From the `windows-agent` directory, run:
   ```bash
   GOOS=windows GOARCH=amd64 go build -o dist/difae-windows-agent.exe ./cmd/agent
   ```
3. Copy `agent-config.json` next to the generated `difae-windows-agent.exe` before running it.

> **Important:** Do **not** commit compiled binaries to the repository. Build the `.exe` on your own machine following the steps above.
