# Windows IP Camera Agent API

This route powers the “Generate Windows Agent” step in the admin camera onboarding flow. It accepts the camera credentials
from the web UI, bakes them into a per-camera configuration file, packages the pre-built Windows agent executable together
with that configuration, uploads the archive to Cloud Storage and returns a signed download URL.

## Endpoint

```
POST /api/ip-camera/windows-agent
```

## Request payload

```json
{
  "userId": "<Firebase user id>",
  "cameraId": "<optional internal camera id>",
  "cameraName": "<optional display name>",
  "ipAddress": "192.168.18.130",
  "username": "admin",
  "password": "superSecret",
  "rtspPort": 554,
  "rtspPath": "/Streaming/Channels/101"
}
```

- `rtspPort` accepts either a string or number and is coerced server-side.
- `rtspPath` is normalised to include a leading slash if the client omits it.

## Response payload

```json
{
  "downloadUrl": "https://...signed-url..."
}
```

The URL is valid for seven days and points to a zip archive that contains:

- `difae-bridge.exe` – the prebuilt Windows agent binary copied from `agents/windows-bridge/dist/`.
- `config.json` – the generated configuration containing the `bridgeId`, baked RTSP URL and backend bridge URL.

## Behaviour

1. Generates a new `bridgeId` and stores a record in the `cameraBridgeAgents` Firestore collection with status `pending`.
2. Copies the shared agent executable, writes the per-camera `config.json`, then packages the files into a zip archive in-memory.
3. Uploads the archive to Cloud Storage (bucket determined by `WINDOWS_AGENT_BUCKET` or `FIREBASE_STORAGE_BUCKET`).
4. Updates the Firestore document with status `ready`, the storage path and the signed download URL.

If any step fails the document status is set to `failed` and the endpoint responds with HTTP 500.

## Prerequisites

- Place the compiled agent binary at `agents/windows-bridge/dist/difae-bridge.exe` or set
  `WINDOWS_AGENT_TEMPLATE_PATH` to a folder that contains it.
- No external `zip` command is required; the server creates the archive directly using Node.js APIs.
- Set `DIFAE_BRIDGE_BACKEND_URL` if the default `https://bridge.difae.ai` should be overridden.
- Optionally set `WINDOWS_AGENT_BUCKET` to target a custom Cloud Storage bucket (falls back to
  `FIREBASE_STORAGE_BUCKET`).
