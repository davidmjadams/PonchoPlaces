# Event Booking Test Data Strategy

## Goal

Provide deterministic multi-tenant fixtures for Cucumber + Playwright runs, with stable IDs across versions V1-V3.

## Source of truth

- Schema + constraints: `supabase/migrations/20260212000000_event_booking_platform_scaffold.sql`
- Seed helper function: `supabase/migrations/20260212000001_event_booking_seed_helpers.sql`
- E2E helper script: `scripts/e2e/seed-event-booking.mjs`
- Cucumber helper: `e2e/steps/support/event-booking.seed.js`

## Baseline seed profile (`baseline`)

Creates deterministic fixtures for:

- Organizers:
  - `Little Acorns` (`00000000-0000-0000-0000-000000000101`)
  - `Riverdale Kids` (`00000000-0000-0000-0000-000000000102`)
- Events:
  - `Half Term Camp`, `Toddler Music Monday`, `Art Explorers Course`, `Saturday Drop-In Football`
- Event sessions:
  - multi-day camp sessions and recurring/course occurrences
- Ticket types:
  - deterministic IDs (`3333...`)
- Orders:
  - one `pending_payment`, one `paid`
- Booking:
  - one confirmed booking (`LA-BOOK-0001`)
- Waitlist:
  - one waiting entry
- Payment/webhook/refund/check-in/audit sample rows

## How tests create and use data

1. Reset DB for isolated feature execution.
2. Re-apply schema migrations.
3. Load baseline app seeds (`db:seed:e2e`) for existing domains.
4. Call `seed_event_booking_e2e('baseline')` via service-role client.
5. Execute Playwright steps against deterministic IDs from feature files.

## Local workflow

```sh
pnpm db:supabase:start
pnpm db:supabase:reset
pnpm db:push
pnpm e2e:seed:event-booking
```

## Extending fixtures

- Keep existing IDs stable.
- Add new fixtures with new UUID blocks per domain area.
- Prefer additive seed evolution so old scenarios remain valid.
- If state transition behavior changes, keep old fixture rows but add new rows for the changed flow.
