# Event Booking Domain Model (V1-V3 Scaffold)

## Core concepts

- **Organizer**: tenant/provider running events on the platform.
- **Organizer membership**: links a user to an organizer with role `admin`, `editor`, or `check_in`.
- **Event**: sellable activity template (`single_session`, `course_multi_session`, `recurring_drop_in`, `camp_multi_day`).
- **Event session**: specific date/time occurrence for an event.
- **Ticket type**: purchasable SKU for an event (price/capacity/rules).
- **Order (Basket)**: draft-to-paid container for checkout.
- **Order item**: one event+ticket line in an order.
- **Order item attendee slot**: per-attendee hold/confirmation row for capacity + forms.
- **Booking**: post-checkout reservation record per purchased event/session.
- **Booking attendee**: attendee-level record used for check-in/refund/cancellation.
- **Waitlist entry**: queued attendee demand when no capacity is available.
- **Discount**: organizer-defined rule (early bird, sibling, group tier; advanced rule engine in V3).
- **Form template + fields**: configurable data capture schema for booking/attendee scope.
- **Payment session**: PonchoPay checkout session/intention metadata.
- **Payment webhook event**: idempotent ledger for external payment events.
- **Refund**: refund instruction/outcome row (supports attendee-level partial refunds).
- **Audit log entry**: immutable governance trail for admin/staff actions.

## Relationship summary

- `organizers 1-* events`
- `events 1-* event_sessions`
- `events 1-* event_ticket_types`
- `events *-* discounts` via `event_discounts`
- `organizers 1-* form_templates 1-* form_template_fields`
- `orders 1-* order_items 1-* order_item_attendees`
- `orders 1-* payment_sessions`
- `orders 1-* bookings 1-* booking_attendees`
- `events 1-* waitlist_entries`
- `orders 1-* refunds` and optional `refunds -> booking_attendees`
- `organizers 1-* organizer_memberships`
- `organizers 1-* audit_log_entries`

## State machines

- **Order**: `draft -> pending_payment -> paid -> partially_refunded -> refunded -> cancelled`
- **Booking**: `reserved -> confirmed -> cancelled`
- **Attendee slot**: `held -> confirmed -> cancelled`
- **Waitlist**: `waiting -> offered -> accepted -> expired`

## Concurrency and idempotency strategy

- Capacity protection is modeled with transactional helpers:
  - `reserve_ticket_capacity(ticket_type_id, quantity)` uses row-level locks (`FOR UPDATE`) on event + ticket rows.
  - both event-level and ticket-level capacities are checked before counters are incremented.
- Webhook idempotency is modeled with:
  - `payment_webhook_events` unique key on `(provider, provider_event_id)`.
  - helper `upsert_payment_webhook_event(...)` for retry-safe ingestion and late/out-of-order persistence.
- Redirect return and webhook timing are decoupled:
  - return page reads current `orders.state`.
  - webhook endpoint is source-of-truth for confirmation transitions.

## UK timezone + i18n note

- Default organizer/event timezone is `Europe/London`.
- Columns are timezone-aware (`timestamptz`) and model supports per-organizer/per-event timezone overrides.
