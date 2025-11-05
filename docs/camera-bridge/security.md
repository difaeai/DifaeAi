# Security Notes

- Playback tokens are JWTs signed with RS256 and expire after 5 minutes.
- Replace the development RSA key pair in `infra/keys` before deploying to production.
- Store secrets in a dedicated KMS or secret manager (AWS KMS, Hashicorp Vault, etc.).
- Enable HTTPS termination in front of Janus, nginx-rtmp, and the Bridge API.
- Constrain CORS origins via `CORS_ALLOWED_ORIGINS` and validate tokens server-side before relaying to playback.
