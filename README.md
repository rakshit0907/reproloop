# ReproLoop

**From user-reported software problems to developer-verified fixes.**

ReproLoop is an early-stage platform for turning a plain-language bug report into an
evidence-backed resolution path: structured report → investigation → proposed patch →
real test run → human approval. A fix is never called "fixed" because an AI wrote a patch;
it needs actual test output and a developer's decision.

> **Status: early MVP foundation.** The product shell works end to end (accounts, projects,
> reports, access control). The AI investigation and test-verification pipeline described
> below is **not built yet**. See "Not built yet".

## What works today

- Register and sign in (bcrypt password hashing, JWT).
- Developers create projects; reporters file problems against them.
- Reports with plain-language fields, a searchable/filterable/paginated incident list, and a detail page.
- Role-based access: reporters see only their own reports, without internal fields; developers see incidents
  in projects they own; other users get a 404 (no ID probing).
- PostgreSQL schema managed with TypeORM migrations, including an append-only `incident_events` table.
- Request validation, and unit tests for authentication, project access and incident access.

## Not built yet

- BharatCode model integration and the six agents (intake, diagnostic, pattern detection,
  root cause, repair, verification).
- GitHub repository integration.
- Sandboxed patch verification, patch review and approve/reject.
- The workflow state machine and event timeline (the table exists; nothing writes to it yet).
- Screenshot upload and browser diagnostics.

## Stack

Next.js (App Router, TypeScript, Tailwind CSS v3) · NestJS (TypeScript, REST under `/api/v1`) ·
PostgreSQL · TypeORM · Vitest.

## Run it locally (Windows PowerShell)

Requirements: Node.js 24, Docker Desktop.

```powershell
npm install
docker compose up -d
```

Create `apps/api/.env` from `apps/api/.env.example`. Set `DATABASE_PASSWORD=reproloop_dev` (the local Docker
value) and generate a secret for `JWT_SECRET`:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Create `apps/web/.env.local` from `apps/web/.env.example`, then:

```powershell
npm run migration:run --workspace=api
npm run dev:api     # http://localhost:3001/api/v1/health
npm run dev:web     # http://localhost:3000
```

Register a **Developer** account, create a project under **Projects**, then register a **Reporter** in a private
window and file a report.

Ports: web 3000, API 3001, PostgreSQL 5434 (mapped to avoid clashing with a local Postgres).

Tests: `npm run test:api`

## Notes

- Tailwind v3 is used because Tailwind v4's native binary was blocked by a Windows application-control policy
  on the development machine.
- Anyone can register as a developer. This is a demo convenience, not a production access model.
- Auth tokens are kept in `localStorage`, which is acceptable for a demo but not for production.