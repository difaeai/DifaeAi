## Security Review Checklist

- [ ] Confirm discovery probes are limited to authorized subnets and respect the configured rate limit.
- [ ] Verify ONVIF and RTSP probes only attempt the documented path list; no credential brute forcing is implemented.
- [ ] Ensure audit logging is enabled on the backend for every probe and stream request.
- [ ] Confirm bridge agent pairing requires the one-time code presented in the frontend and tokens expire within 10 minutes.
- [ ] Validate TLS certificates for backend ↔ bridge-agent communication before production deployment.
- [ ] Check that persisted recordings are encrypted at rest and keys are rotated on the policy schedule.
- [ ] Review access control lists (ACLs) per camera and confirm least privilege.
- [ ] Perform manual penetration testing on the LAN to confirm no unintended ports/services are exposed.
