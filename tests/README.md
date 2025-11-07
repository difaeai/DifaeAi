## Test Suites

- `tests/backend` — Vitest unit/integration tests for the Express API (run with `npm run test:backend`)
- `frontend/src/**/*.test.tsx` — UI component tests (run with `npm run test:frontend`)
- `bridge-agent/tests` — pytest coverage for LAN bridge pairing (`pip install -e bridge-agent[dev] && pytest bridge-agent/tests`)

Add new suites beside the component they validate and update this file with execution instructions.
