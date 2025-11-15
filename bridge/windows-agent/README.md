# Windows Camera Bridge Agent

This folder contains the Windows background agent that relays RTSP camera streams to the Difae backend. The agent is a [.NET 8](https://dotnet.microsoft.com/en-us/download/dotnet/8.0) worker service that runs as a console application and is packaged as a self-contained Win32 executable targeting **win-x64**.

## Project layout

- `WindowsCameraBridge.csproj` – .NET project configured for self-contained, single-file publish.
- `Program.cs` – entry point that wires up dependency injection, logging, and hosted services.
- `Services/` – configuration loading, FFmpeg relay loop, and auto-start registration.
- `Logging/FileLoggerProvider.cs` – lightweight logger that writes to `windows-agent.log` next to the executable.
- `agent-config.template.json` – template configuration copied into published packages.

## Building the agent

The repository root exposes an npm script that publishes the agent and produces an updated template zip:

```bash
npm run build:windows-agent
```

The command runs:

```bash
dotnet publish bridge/windows-agent/WindowsCameraBridge.csproj \
  -c Release \
  -r win-x64 \
  --self-contained true \
  -p:PublishSingleFile=true \
  -o bridge/windows-agent/publish
```

After publishing, MSBuild bundles the executable and `agent-config.json` into `bridge/windows-agent/windows-agent-template.zip`. The publish directory will contain the raw `WindowsCameraBridge.exe` alongside the generated configuration template.

> **Note:** The build requires the .NET 8 SDK and a Windows FFmpeg binary available at runtime. Place `ffmpeg.exe` on the system `PATH` or update `agent-config.json` with the absolute path under the `ffmpeg.path` property.

## Runtime behaviour

1. The agent loads `agent-config.json` located beside the executable. Environment variables such as `BRIDGE_ID`, `RTSP_URL`, or `FFMPEG_PATH` can override values during troubleshooting.
2. The background worker registers a scheduled task (`DifaeCameraBridge`) on first launch (when running interactively with administrator privileges) so the agent starts automatically on user logon.
3. The worker launches an FFmpeg process to pull the RTSP stream and forwards the MPEG-TS output to the backend relay endpoint specified by `backendUrl` + `relayEndpoint`.
4. All activity is logged to both the console and `windows-agent.log` in the agent directory. Logs include reconnect attempts and FFmpeg stderr output.
5. If the network connection drops or FFmpeg exits, the worker retries with exponential back-off up to five minutes between attempts.

## Packaging for distribution

The Next.js API endpoint expects `bridge/windows-agent/windows-agent-template.zip` to exist. Each request copies the template into a temporary directory, injects a fresh `agent-config.json`, re-zips the folder, and hands the archive to the browser.

Run the build command whenever the agent code changes to refresh the template before deploying the web application.
