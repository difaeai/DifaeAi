# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Running locally (Windows PowerShell)

Prerequisites:

- Node.js (18 or 20 LTS) installed and available on PATH
- npm (comes with Node) or an alternative package manager
- ffmpeg (optional: required only for RTSP/video streaming features) available on PATH

Install dependencies and run the dev server:

```powershell
cd /d D:\New\DIFAE
npm ci
npm run dev
```

Build and run in production mode (PowerShell example):

```powershell
cd /d D:\New\DIFAE
npm run build
#$env:NODE_ENV = 'production'  # not required if using the provided start script
npm start
```

Notes:

- The server's production entry (`server.ts`) spawns `ffmpeg` for the `/stream` WebSocket endpoint. If `ffmpeg` isn't installed or not on your PATH, connections to `/stream` will fail and you'll see a clear error message in the server logs. Install ffmpeg from https://ffmpeg.org or via a package manager (choco/winget) on Windows.
- The `start` script was adjusted to be cross-platform using `cross-env`.
