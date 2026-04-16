# WorkPulse backend — production

## Environment

Copy [`.env.example`](.env.example) to `.env` and set:

- **`DATABASE_URL`** — PostgreSQL connection string.
- **`JWT_SECRET`** — long random string; never commit the real value.
- **`CORS_ORIGIN`** — comma-separated allowed browser origins (e.g. `https://panel.example.com`).
- **`INTERNAL_API_KEY`** — shared secret for services that call `/api/internal/*` (turnstile ingest, etc.). Send as header `X-Internal-Key` or `Authorization: Bearer <key>`. **In production (`NODE_ENV=production`) this must be set** — otherwise every internal route returns 401. In non-production, an empty key still allows access (local development only).
- **`NODE_ENV=production`** — enables stricter defaults; use migrations instead of TypeORM `synchronize` in real deployments.
- **`CAMERA_ENTRY_SNAPSHOT_URL` / `CAMERA_EXIT_SNAPSHOT_URL`** — HTTP URLs that return a JPEG when the backend fetches them (after a card swipe). Leave unset to disable snapshots. Cameras should be reachable from the server, not from browsers.
- **`SNAPSHOTS_DIR`** — where JPEG files are stored; ensure the process can write here and that backups cover this folder if required.

## Integratsiyalar

- **Windows agent** — `POST /api/activity/batch` with `Authorization: Bearer <MACHINE_TOKEN>` (per computer; issued when registering the computer).
- **Turnstile / attendance** — `POST /api/internal/attendance/events` with internal API key; see turnstile controllers for the JSON body.

## Build va ishga tushirish

```bash
npm ci
npm run build
NODE_ENV=production node dist/main
```

Docker image: see [`Dockerfile`](Dockerfile) in this folder.
