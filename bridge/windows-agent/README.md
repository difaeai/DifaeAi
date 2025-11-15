# Windows Camera Bridge Agent

This folder contains the Windows background agent that relays RTSP camera streams to the Difae backend. The agent is implemented in Go and compiled into a self-contained Win32 executable targeting **win-x64**.

## Project layout

- `main.go` – entry point that wires up configuration loading, logging, the FFmpeg relay loop, and auto-start registration.
- `go.mod` – module definition used by the Go toolchain when cross-compiling to Windows.
- `agent-config.template.json` – template configuration copied into published packages.

## Building the agent

The repository root exposes an npm script that cross-compiles the agent for Windows:

```bash
npm run build:windows-agent
```

The script clears `bridge/windows-agent/publish/`, compiles the Go program for `windows/amd64`, and places the resulting `WindowsCameraBridge.exe` beside a copy of `agent-config.template.json`. A convenience archive (`windows-agent-template.zip`) is also produced for manual distribution and is ignored by git.

> **Note:** Building requires Go 1.21+ and a Windows FFmpeg binary available at runtime. Place `ffmpeg.exe` on the system `PATH` or update `agent-config.json` with the absolute path under the `ffmpeg.path` property.

## Runtime behaviour

1. The agent loads `agent-config.json` located beside the executable. Environment variables such as `BRIDGE_ID`, `RTSP_URL`, or `FFMPEG_PATH` can override values during troubleshooting.
2. The background worker registers a scheduled task (`DifaeCameraBridge`) on first launch (when running interactively with administrator privileges) so the agent starts automatically on user logon.
3. The worker launches an FFmpeg process to pull the RTSP stream and forwards the MPEG-TS output to the backend relay endpoint specified by `backendUrl` + `relayEndpoint`.
4. All activity is logged to both the console and `windows-agent.log` in the agent directory. Logs include reconnect attempts and FFmpeg stderr output.
5. If the network connection drops or FFmpeg exits, the worker retries with exponential back-off up to five minutes between attempts.

## Packaging for distribution

The Next.js API endpoint compiles the agent on demand (unless `WINDOWS_AGENT_EXECUTABLE_PATH` overrides the location) and packages the executable together with a generated `agent-config.json` for each download request. Running `npm run build:windows-agent` ahead of time ensures the cached executable is available so the API can package archives without rebuilding the binary on every request.
