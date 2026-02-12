# mamuf

SvelteKit + Svelte 5 app with PostgreSQL, using **Drizzle ORM** and **Supabase** (local or hosted) for the database.

## Architecture rules (high level)

- **Organise by domain concept**: entities, stores, services, and controllers live under a domain folder (e.g. `user`, `item`), not in type-based folders.
- **Keep responsibilities small**: stores do persistence, services orchestrate domain operations, controllers/routes do HTTP + validation and call services.
- **Avoid client-side secrets**: `DATABASE_URL` and DB access must stay in server-only modules.

## Repo layout (important parts)

- **UI routes**: `src/routes/**`
- **Server-side domain code**: `src/lib/server/domain/**`
- **Infra (composition & environment selection)**: `src/lib/server/infra/**`
- **Database client**: `src/lib/server/db/client.ts`
- **Drizzle schema entrypoint**: `src/lib/server/db/schema.ts` (may aggregate domain schemas)
- **Seeding**: `src/lib/server/db/seed/*`
- **E2E tests**: `e2e/**` (run via `scripts/e2e/run.mjs`)

## Setup

```sh
pnpm install
cp .env.example .env
```

## Auth (Supabase)

This template uses **Supabase Auth (SSR)** with cookies.\n
You must set these public env vars (safe to expose to the browser):\n
- `PUBLIC_SUPABASE_URL`\n
- `PUBLIC_SUPABASE_ANON_KEY`\n
\n
Once configured:\n
- Visit `/login` to sign in or create an account\n
- Visit `/restricted-items` to see an auth-protected page\n

## Local database (Supabase)

```sh
pnpm db:supabase:start
pnpm db:push
pnpm db:seed
```

## Development

```sh
pnpm dev
```

Or run the dev server with DB lifecycle helpers:

```sh
pnpm dev:db
```

## Database commands

All database commands rely on `drizzle.config.ts`.

```sh
pnpm db:generate
pnpm db:migrate
pnpm db:push
pnpm db:studio
pnpm db:seed
pnpm db:seed:e2e
```

## E2E

```sh
pnpm e2e:run
```

## Notes

- Keep `DATABASE_URL` server-side only (SvelteKit private env).
- Prefer adding new domains under `src/lib/server/domain/<domain>/...` and keeping DB schema definitions close to their domain.

## Adding a new domain (ports/adapters/modules)

Create a new folder: `src/lib/server/domain/<domain>/`

Recommended files (example: `inventory`):

- **Entity / schema**: `inventory.entity.ts`
- **Ports**: `inventory.ports.ts`
  - Define `InventoryStorePort`, `InventoryServicePort`, etc.
- **Adapters**:
  - DB adapter: `inventory.store.ts` (e.g. `createDbInventoryStore`)
  - Optional alternate adapter: `inventory.store.fs.ts`, `inventory.store.http.ts`, etc
- **Services**:
  - Default service: `inventory.service.ts` (depends on ports)
  - Optional env-specific: `inventory.service.development.ts` (if you need to swap the whole implementation)
- **Modules (wiring only)**:
  - `inventory.module.ts` (default export factory; wires prod adapters/services)
  - `inventory.module.development.ts`, `inventory.module.production.ts`, `inventory.module.testing.ts`
    - if present, these completely swap adapters/services for that environment

If your domain defines new tables, re-export them from `src/lib/server/db/schema.ts` so Drizzle tooling can see them.

## Using a domain module from a controller/page

Use the generic loader in infra to select the right module based on `APP_ENV` (fallbacks to `NODE_ENV`):

- `src/lib/server/infra/domainModule.ts` loads:
  - `<domain>.module.development.ts` / `.production.ts` / `.testing.ts` when present
  - otherwise falls back to `<domain>.module.ts`

In a `+page.server.ts` / `+server.ts`:

- Import the module type and loader
- Call `getDomainModule('<domain>')` and use the returned service(s)
