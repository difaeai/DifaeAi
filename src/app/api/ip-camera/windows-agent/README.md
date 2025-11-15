# Windows IP Camera Agent API

This route powers the “Generate Windows Agent” step in the admin camera onboarding flow. It accepts camera credentials from
the web UI, writes them into a per-camera `agent-config.json`, injects that file into a prebuilt Windows agent zip and returns
a download URL for the customized package.

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

The URL is valid for seven days and points directly to a camera-specific zip archive. The endpoint copies a shared template
(`bridge/windows-agent/windows-agent-template.zip`), replaces `agent-config.json` with the generated payload, re-zips the
folder and returns the signed download URL.

### Error responses

Failures include an HTTP status, a human readable `error` string and a machine readable `code` property. The codes are defined
in [`src/lib/windows-agent/errors.ts`](../../../../lib/windows-agent/errors.ts) and surface common failure cases such as
validation errors, missing templates and storage misconfiguration. The UI maps these codes to user friendly messages while the
server logs retain the underlying error details.

## Behaviour

1. Generates a new `bridgeId` and stores a record in the `cameraBridgeAgents` Firestore collection with status `pending`.
2. Copies the shared template zip, writes `agent-config.json` with the per-camera credentials and relay settings, then creates a
   new archive.
3. Uploads the customized archive to Cloud Storage (bucket determined by `WINDOWS_AGENT_BUCKET` or `FIREBASE_STORAGE_BUCKET`)
   with download headers so browsers prompt to save it as a `.zip` file.
4. Updates the Firestore document with status `ready`, the storage path and the signed download URL.

If any step fails the document status is set to `failed` and the endpoint responds with HTTP 500.

## Prerequisites

- Build the Windows agent by running `npm run build:windows-agent`. This publishes the .NET worker and creates
  `bridge/windows-agent/windows-agent-template.zip`.
- Set `DIFAE_BRIDGE_BACKEND_URL` if the default `https://bridge.difae.ai` should be overridden.
- Optionally configure `DIFAE_BRIDGE_RELAY_ENDPOINT`, `DIFAE_BRIDGE_AGENT_API_KEY`, or `DIFAE_BRIDGE_AGENT_FFMPEG_PATH` to
override defaults written into the config file.
- Optionally set `WINDOWS_AGENT_BUCKET` to target a custom Cloud Storage bucket (falls back to `FIREBASE_STORAGE_BUCKET`).
- The server host must provide `zip`/`unzip` on Unix or PowerShell on Windows so the archive can be extracted and repackaged.
