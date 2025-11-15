# Windows IP Camera Agent API

This route powers the “Generate Windows Agent” step in the admin camera onboarding flow. It accepts the camera credentials
from the web UI, bakes them into a per-camera configuration payload, embeds it into the pre-built Windows agent executable,
uploads the executable to Cloud Storage and returns a signed download URL.

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

The URL is valid for seven days and points directly to a customised `difae-bridge.exe` binary. The endpoint copies the shared
executable from `agents/windows-bridge/dist/`, appends the generated configuration (`bridgeId`, RTSP URL and backend URL) to
the end of the binary and serves the signed download URL.

## Behaviour

1. Generates a new `bridgeId` and stores a record in the `cameraBridgeAgents` Firestore collection with status `pending`.
2. Copies the shared agent executable and embeds the per-camera configuration directly into the binary.
3. Uploads the customised executable to Cloud Storage (bucket determined by `WINDOWS_AGENT_BUCKET` or `FIREBASE_STORAGE_BUCKET`) with download headers so browsers prompt to save it as an `.exe` file.
4. Updates the Firestore document with status `ready`, the storage path and the signed download URL.

If any step fails the document status is set to `failed` and the endpoint responds with HTTP 500.

## Prerequisites

- Place the compiled agent binary at `agents/windows-bridge/dist/difae-bridge.exe` or set
  `WINDOWS_AGENT_TEMPLATE_PATH` to a folder that contains it.
- No external `zip` command is required; the server modifies the executable directly using Node.js APIs.
- Set `DIFAE_BRIDGE_BACKEND_URL` if the default `https://bridge.difae.ai` should be overridden.
- Optionally set `WINDOWS_AGENT_BUCKET` to target a custom Cloud Storage bucket (falls back to
  `FIREBASE_STORAGE_BUCKET`).
- Provide a code-signing certificate so Windows Defender trusts the generated agent:
  - `WINDOWS_AGENT_SIGNING_CERT_PATH` — path to a `.pfx` / `.p12` certificate bundle on disk.
  - `WINDOWS_AGENT_SIGNING_CERT_PASSWORD` — password for the certificate (if applicable).
  - `WINDOWS_AGENT_SIGNTOOL_PATH` — set if the Windows `signtool` binary is available.
  - otherwise install [`osslsigncode`](https://github.com/mtrojnar/osslsigncode) and expose it via
    `WINDOWS_AGENT_OSSL_SIGNCODE_PATH` (defaults to `osslsigncode` on `$PATH`).
  - Optional metadata: `WINDOWS_AGENT_SIGNING_DESCRIPTION`, `WINDOWS_AGENT_SIGNING_URL`, and
    `WINDOWS_AGENT_SIGNING_TIMESTAMP_URL`.
