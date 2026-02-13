create extension if not exists pgcrypto;

do $$
begin
	create type public.organizer_staff_role as enum ('admin', 'editor', 'check_in');
exception
	when duplicate_object then null;
end $$;

do $$
begin
	create type public.event_type as enum (
		'single_session',
		'course_multi_session',
		'recurring_drop_in',
		'camp_multi_day'
	);
exception
	when duplicate_object then null;
end $$;

do $$
begin
	create type public.event_status as enum ('draft', 'published', 'cancelled', 'archived');
exception
	when duplicate_object then null;
end $$;

do $$
begin
	create type public.session_status as enum ('scheduled', 'cancelled');
exception
	when duplicate_object then null;
end $$;

-- Basket/Order state machine:
-- draft -> pending_payment -> paid -> partially_refunded -> refunded -> cancelled
do $$
begin
	create type public.order_state as enum (
		'draft',
		'pending_payment',
		'paid',
		'partially_refunded',
		'refunded',
		'cancelled'
	);
exception
	when duplicate_object then null;
end $$;

-- Booking state machine:
-- reserved -> confirmed -> cancelled
do $$
begin
	create type public.booking_state as enum ('reserved', 'confirmed', 'cancelled');
exception
	when duplicate_object then null;
end $$;

-- Attendee slot state machine:
-- held -> confirmed -> cancelled
do $$
begin
	create type public.attendee_slot_state as enum ('held', 'confirmed', 'cancelled');
exception
	when duplicate_object then null;
end $$;

-- Waitlist state machine:
-- waiting -> offered -> accepted -> expired
do $$
begin
	create type public.waitlist_state as enum ('waiting', 'offered', 'accepted', 'expired');
exception
	when duplicate_object then null;
end $$;

do $$
begin
	create type public.capture_scope as enum ('booking', 'attendee');
exception
	when duplicate_object then null;
end $$;

do $$
begin
	create type public.capture_field_type as enum (
		'text',
		'email',
		'phone',
		'dropdown',
		'radio',
		'checkbox',
		'dob',
		'file',
		'repeating_group',
		'gdpr_consent'
	);
exception
	when duplicate_object then null;
end $$;

do $$
begin
	create type public.discount_type as enum ('early_bird', 'group_tier', 'siblings', 'rule_expression');
exception
	when duplicate_object then null;
end $$;

do $$
begin
	create type public.discount_combination_mode as enum ('exclusive', 'combinable');
exception
	when duplicate_object then null;
end $$;

do $$
begin
	create type public.payment_status as enum ('created', 'requires_action', 'succeeded', 'failed', 'cancelled');
exception
	when duplicate_object then null;
end $$;

do $$
begin
	create type public.refund_status as enum ('pending', 'succeeded', 'failed');
exception
	when duplicate_object then null;
end $$;

do $$
begin
	create type public.webhook_processing_state as enum ('received', 'processed', 'ignored', 'failed');
exception
	when duplicate_object then null;
end $$;

do $$
begin
	create type public.moderation_state as enum ('pending', 'approved', 'rejected');
exception
	when duplicate_object then null;
end $$;

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

create or replace function public.current_auth_email()
returns text
language sql
stable
as $$
	select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
as $$
	select coalesce((auth.jwt() -> 'app_metadata' ->> 'platform_role') = 'admin', false);
$$;

create table if not exists public.organizers (
	id uuid primary key default gen_random_uuid(),
	slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
	name text not null,
	default_timezone text not null default 'Europe/London',
	allow_guest_checkout boolean not null default true,
	booking_terms text,
	status text not null default 'active' check (status in ('active', 'paused', 'archived')),
	metadata jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.organizer_memberships (
	id uuid primary key default gen_random_uuid(),
	organizer_id uuid not null references public.organizers(id) on delete cascade,
	user_id uuid not null references auth.users(id) on delete cascade,
	role public.organizer_staff_role not null,
	created_at timestamptz not null default now(),
	unique (organizer_id, user_id, role)
);

create table if not exists public.locations (
	id uuid primary key default gen_random_uuid(),
	organizer_id uuid not null references public.organizers(id) on delete cascade,
	name text not null,
	address_line_1 text,
	address_line_2 text,
	city text,
	postcode text,
	country_code char(2) not null default 'GB',
	timezone text not null default 'Europe/London',
	online_join_url text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.cancellation_policies (
	id uuid primary key default gen_random_uuid(),
	organizer_id uuid not null references public.organizers(id) on delete cascade,
	name text not null,
	policy_text text not null,
	refund_window_hours integer check (refund_window_hours is null or refund_window_hours >= 0),
	default_refund_percent integer not null default 0 check (default_refund_percent between 0 and 100),
	allow_partial_refunds boolean not null default false,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.form_templates (
	id uuid primary key default gen_random_uuid(),
	organizer_id uuid not null references public.organizers(id) on delete cascade,
	name text not null,
	event_type_scope public.event_type,
	applies_to text not null check (applies_to in ('organizer_default', 'event_type_default', 'event_override')),
	version integer not null default 1 check (version > 0),
	is_active boolean not null default true,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (organizer_id, name, version)
);

create table if not exists public.form_template_fields (
	id uuid primary key default gen_random_uuid(),
	template_id uuid not null references public.form_templates(id) on delete cascade,
	scope public.capture_scope not null,
	field_key text not null,
	label text not null,
	field_type public.capture_field_type not null,
	sort_order integer not null default 0,
	required boolean not null default false,
	options jsonb not null default '[]'::jsonb,
	conditional_logic jsonb not null default '{}'::jsonb,
	repeatable boolean not null default false,
	gdpr_consent_text text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (template_id, scope, field_key)
);

create table if not exists public.events (
	id uuid primary key default gen_random_uuid(),
	organizer_id uuid not null references public.organizers(id) on delete cascade,
	slug text not null,
	title text not null,
	description text,
	event_type public.event_type not null default 'single_session',
	status public.event_status not null default 'draft',
	timezone text not null default 'Europe/London',
	location_id uuid references public.locations(id) on delete set null,
	online_join_url text,
	min_age_months integer check (min_age_months is null or min_age_months >= 0),
	max_age_months integer check (max_age_months is null or max_age_months >= 0),
	capacity_total integer check (capacity_total is null or capacity_total > 0),
	confirmed_attendee_count integer not null default 0 check (confirmed_attendee_count >= 0),
	waitlist_enabled boolean not null default true,
	waitlist_capacity integer check (waitlist_capacity is null or waitlist_capacity > 0),
	cancellation_policy_id uuid references public.cancellation_policies(id) on delete set null,
	form_template_id uuid references public.form_templates(id) on delete set null,
	safeguarding_ack_required boolean not null default false,
	consent_text text,
	starts_at timestamptz,
	ends_at timestamptz,
	metadata jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (organizer_id, slug),
	check (
		max_age_months is null
		or min_age_months is null
		or max_age_months >= min_age_months
	),
	check (
		(starts_at is null and ends_at is null)
		or (starts_at is not null and ends_at is not null and ends_at > starts_at)
	)
);

create table if not exists public.event_sessions (
	id uuid primary key default gen_random_uuid(),
	event_id uuid not null references public.events(id) on delete cascade,
	starts_at timestamptz not null,
	ends_at timestamptz not null,
	is_all_day boolean not null default false,
	capacity_override integer check (capacity_override is null or capacity_override > 0),
	confirmed_attendee_count integer not null default 0 check (confirmed_attendee_count >= 0),
	status public.session_status not null default 'scheduled',
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	check (ends_at > starts_at),
	unique (event_id, starts_at)
);

create table if not exists public.event_ticket_types (
	id uuid primary key default gen_random_uuid(),
	event_id uuid not null references public.events(id) on delete cascade,
	name text not null,
	description text,
	currency_code char(3) not null default 'GBP',
	unit_price_pence integer not null check (unit_price_pence >= 0),
	capacity integer check (capacity is null or capacity > 0),
	confirmed_attendee_count integer not null default 0 check (confirmed_attendee_count >= 0),
	min_per_booking integer not null default 1 check (min_per_booking > 0),
	max_per_booking integer check (max_per_booking is null or max_per_booking > 0),
	sale_starts_at timestamptz,
	sale_ends_at timestamptz,
	is_active boolean not null default true,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (event_id, name),
	check (
		max_per_booking is null
		or max_per_booking >= min_per_booking
	),
	check (
		sale_starts_at is null
		or sale_ends_at is null
		or sale_ends_at > sale_starts_at
	)
);

create table if not exists public.discounts (
	id uuid primary key default gen_random_uuid(),
	organizer_id uuid not null references public.organizers(id) on delete cascade,
	code text not null,
	name text not null,
	discount_type public.discount_type not null,
	combination_mode public.discount_combination_mode not null default 'exclusive',
	priority integer not null default 100,
	is_active boolean not null default true,
	starts_at timestamptz,
	ends_at timestamptz,
	config jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (organizer_id, code),
	check (
		starts_at is null
		or ends_at is null
		or ends_at > starts_at
	)
);

create table if not exists public.event_discounts (
	event_id uuid not null references public.events(id) on delete cascade,
	discount_id uuid not null references public.discounts(id) on delete cascade,
	created_at timestamptz not null default now(),
	primary key (event_id, discount_id)
);

create table if not exists public.attendee_profiles (
	id uuid primary key default gen_random_uuid(),
	owner_user_id uuid not null references auth.users(id) on delete cascade,
	first_name text not null,
	last_name text not null,
	dob date,
	configurable_data jsonb not null default '{}'::jsonb,
	emergency_contacts jsonb not null default '[]'::jsonb,
	medical_notes jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.orders (
	id uuid primary key default gen_random_uuid(),
	organizer_id uuid not null references public.organizers(id) on delete restrict,
	user_id uuid references auth.users(id) on delete set null,
	guest_email text,
	guest_name text,
	currency_code char(3) not null default 'GBP',
	state public.order_state not null default 'draft',
	subtotal_pence integer not null default 0 check (subtotal_pence >= 0),
	discount_total_pence integer not null default 0 check (discount_total_pence >= 0),
	total_pence integer not null default 0 check (total_pence >= 0),
	ponchopay_checkout_session_id text unique,
	idempotency_key text not null unique default gen_random_uuid()::text,
	checkout_started_at timestamptz,
	paid_at timestamptz,
	cancelled_at timestamptz,
	metadata jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	check (user_id is not null or guest_email is not null)
);

create table if not exists public.order_items (
	id uuid primary key default gen_random_uuid(),
	order_id uuid not null references public.orders(id) on delete cascade,
	event_id uuid not null references public.events(id) on delete restrict,
	event_session_id uuid references public.event_sessions(id) on delete set null,
	ticket_type_id uuid not null references public.event_ticket_types(id) on delete restrict,
	quantity integer not null check (quantity > 0),
	unit_price_pence integer not null check (unit_price_pence >= 0),
	discount_total_pence integer not null default 0 check (discount_total_pence >= 0),
	line_total_pence integer not null check (line_total_pence >= 0),
	applied_discount_snapshot jsonb not null default '[]'::jsonb,
	metadata jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.order_item_attendees (
	id uuid primary key default gen_random_uuid(),
	order_item_id uuid not null references public.order_items(id) on delete cascade,
	attendee_profile_id uuid references public.attendee_profiles(id) on delete set null,
	attendee_name text not null,
	attendee_dob date,
	state public.attendee_slot_state not null default 'held',
	hold_expires_at timestamptz,
	booking_form_response jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
	id uuid primary key default gen_random_uuid(),
	organizer_id uuid not null references public.organizers(id) on delete restrict,
	order_id uuid references public.orders(id) on delete set null,
	order_item_id uuid references public.order_items(id) on delete set null,
	event_id uuid not null references public.events(id) on delete restrict,
	event_session_id uuid references public.event_sessions(id) on delete set null,
	booked_by_user_id uuid references auth.users(id) on delete set null,
	guest_email text,
	state public.booking_state not null default 'reserved',
	booking_reference text not null unique,
	confirmed_at timestamptz,
	cancelled_at timestamptz,
	cancellation_reason text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	check (booked_by_user_id is not null or guest_email is not null)
);

create table if not exists public.booking_attendees (
	id uuid primary key default gen_random_uuid(),
	booking_id uuid not null references public.bookings(id) on delete cascade,
	order_item_attendee_id uuid references public.order_item_attendees(id) on delete set null,
	attendee_profile_id uuid references public.attendee_profiles(id) on delete set null,
	attendee_name text not null,
	attendee_dob date,
	state public.attendee_slot_state not null default 'held',
	check_in_at timestamptz,
	custom_form_response jsonb not null default '{}'::jsonb,
	medical_notes text,
	emergency_contact jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.waitlist_entries (
	id uuid primary key default gen_random_uuid(),
	organizer_id uuid not null references public.organizers(id) on delete cascade,
	event_id uuid not null references public.events(id) on delete cascade,
	event_session_id uuid references public.event_sessions(id) on delete set null,
	ticket_type_id uuid references public.event_ticket_types(id) on delete set null,
	order_id uuid references public.orders(id) on delete set null,
	user_id uuid references auth.users(id) on delete set null,
	guest_email text,
	attendee_name text not null,
	state public.waitlist_state not null default 'waiting',
	offered_at timestamptz,
	response_due_at timestamptz,
	accepted_at timestamptz,
	expired_at timestamptz,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	check (user_id is not null or guest_email is not null)
);

create table if not exists public.payment_sessions (
	id uuid primary key default gen_random_uuid(),
	order_id uuid not null references public.orders(id) on delete cascade,
	provider text not null default 'ponchopay',
	provider_session_id text unique,
	provider_intent_id text,
	status public.payment_status not null default 'created',
	redirect_url text,
	amount_pence integer not null check (amount_pence >= 0),
	currency_code char(3) not null default 'GBP',
	idempotency_key text not null unique,
	raw_request jsonb not null default '{}'::jsonb,
	raw_response jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.refunds (
	id uuid primary key default gen_random_uuid(),
	organizer_id uuid not null references public.organizers(id) on delete cascade,
	order_id uuid not null references public.orders(id) on delete cascade,
	booking_attendee_id uuid references public.booking_attendees(id) on delete set null,
	provider_refund_id text unique,
	amount_pence integer not null check (amount_pence > 0),
	reason text,
	status public.refund_status not null default 'pending',
	requested_by_user_id uuid references auth.users(id) on delete set null,
	requested_at timestamptz not null default now(),
	processed_at timestamptz,
	metadata jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.payment_webhook_events (
	id uuid primary key default gen_random_uuid(),
	provider text not null default 'ponchopay',
	provider_event_id text not null,
	event_type text not null,
	order_id uuid references public.orders(id) on delete set null,
	payment_session_id uuid references public.payment_sessions(id) on delete set null,
	payload jsonb not null default '{}'::jsonb,
	processing_state public.webhook_processing_state not null default 'received',
	error_message text,
	processed_at timestamptz,
	received_at timestamptz not null default now(),
	unique (provider, provider_event_id)
);

create table if not exists public.check_in_records (
	id uuid primary key default gen_random_uuid(),
	organizer_id uuid not null references public.organizers(id) on delete cascade,
	booking_attendee_id uuid not null references public.booking_attendees(id) on delete cascade,
	checked_in_by_user_id uuid references auth.users(id) on delete set null,
	checked_in_at timestamptz not null default now(),
	notes text,
	created_at timestamptz not null default now(),
	unique (booking_attendee_id)
);

create table if not exists public.event_moderation_reviews (
	id uuid primary key default gen_random_uuid(),
	event_id uuid not null references public.events(id) on delete cascade,
	reviewer_user_id uuid references auth.users(id) on delete set null,
	state public.moderation_state not null default 'pending',
	notes text,
	reviewed_at timestamptz,
	created_at timestamptz not null default now()
);

create table if not exists public.admin_impersonation_sessions (
	id uuid primary key default gen_random_uuid(),
	admin_user_id uuid not null references auth.users(id) on delete cascade,
	impersonated_user_id uuid not null references auth.users(id) on delete cascade,
	reason text not null,
	started_at timestamptz not null default now(),
	ended_at timestamptz,
	metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.audit_log_entries (
	id uuid primary key default gen_random_uuid(),
	organizer_id uuid references public.organizers(id) on delete set null,
	actor_user_id uuid references auth.users(id) on delete set null,
	actor_role text,
	action text not null,
	target_table text,
	target_id uuid,
	metadata jsonb not null default '{}'::jsonb,
	correlation_id text,
	occurred_at timestamptz not null default now()
);

create index if not exists idx_organizer_memberships_organizer on public.organizer_memberships (organizer_id);
create index if not exists idx_organizer_memberships_user on public.organizer_memberships (user_id);
create index if not exists idx_locations_organizer on public.locations (organizer_id);
create index if not exists idx_cancellation_policies_organizer on public.cancellation_policies (organizer_id);
create index if not exists idx_events_organizer_status on public.events (organizer_id, status);
create index if not exists idx_events_starts_at on public.events (starts_at);
create index if not exists idx_event_sessions_event_start on public.event_sessions (event_id, starts_at);
create index if not exists idx_event_ticket_types_event on public.event_ticket_types (event_id);
create index if not exists idx_discounts_organizer on public.discounts (organizer_id);
create index if not exists idx_form_templates_organizer on public.form_templates (organizer_id);
create index if not exists idx_form_template_fields_template on public.form_template_fields (template_id, sort_order);
create index if not exists idx_attendee_profiles_owner on public.attendee_profiles (owner_user_id);
create index if not exists idx_orders_organizer_state on public.orders (organizer_id, state);
create index if not exists idx_orders_user on public.orders (user_id);
create index if not exists idx_orders_guest_email on public.orders (lower(guest_email));
create index if not exists idx_order_items_order on public.order_items (order_id);
create index if not exists idx_order_item_attendees_order_item on public.order_item_attendees (order_item_id);
create index if not exists idx_bookings_organizer_state on public.bookings (organizer_id, state);
create index if not exists idx_bookings_order on public.bookings (order_id);
create index if not exists idx_booking_attendees_booking on public.booking_attendees (booking_id);
create index if not exists idx_waitlist_entries_event_state on public.waitlist_entries (event_id, state);
create index if not exists idx_payment_sessions_order on public.payment_sessions (order_id);
create index if not exists idx_refunds_order on public.refunds (order_id);
create index if not exists idx_refunds_booking_attendee on public.refunds (booking_attendee_id);
create index if not exists idx_webhooks_order on public.payment_webhook_events (order_id);
create index if not exists idx_webhooks_received_at on public.payment_webhook_events (received_at);
create index if not exists idx_check_in_records_organizer on public.check_in_records (organizer_id);
create index if not exists idx_event_moderation_reviews_event on public.event_moderation_reviews (event_id);
create index if not exists idx_admin_impersonation_sessions_admin on public.admin_impersonation_sessions (admin_user_id);
create index if not exists idx_audit_log_entries_org_time on public.audit_log_entries (organizer_id, occurred_at desc);

drop trigger if exists trg_set_updated_at_organizers on public.organizers;
create trigger trg_set_updated_at_organizers
before update on public.organizers
for each row execute procedure public.set_updated_at_timestamp();

drop trigger if exists trg_set_updated_at_locations on public.locations;
create trigger trg_set_updated_at_locations
before update on public.locations
for each row execute procedure public.set_updated_at_timestamp();

drop trigger if exists trg_set_updated_at_cancellation_policies on public.cancellation_policies;
create trigger trg_set_updated_at_cancellation_policies
before update on public.cancellation_policies
for each row execute procedure public.set_updated_at_timestamp();

drop trigger if exists trg_set_updated_at_form_templates on public.form_templates;
create trigger trg_set_updated_at_form_templates
before update on public.form_templates
for each row execute procedure public.set_updated_at_timestamp();

drop trigger if exists trg_set_updated_at_form_template_fields on public.form_template_fields;
create trigger trg_set_updated_at_form_template_fields
before update on public.form_template_fields
for each row execute procedure public.set_updated_at_timestamp();

drop trigger if exists trg_set_updated_at_events on public.events;
create trigger trg_set_updated_at_events
before update on public.events
for each row execute procedure public.set_updated_at_timestamp();

drop trigger if exists trg_set_updated_at_event_sessions on public.event_sessions;
create trigger trg_set_updated_at_event_sessions
before update on public.event_sessions
for each row execute procedure public.set_updated_at_timestamp();

drop trigger if exists trg_set_updated_at_event_ticket_types on public.event_ticket_types;
create trigger trg_set_updated_at_event_ticket_types
before update on public.event_ticket_types
for each row execute procedure public.set_updated_at_timestamp();

drop trigger if exists trg_set_updated_at_discounts on public.discounts;
create trigger trg_set_updated_at_discounts
before update on public.discounts
for each row execute procedure public.set_updated_at_timestamp();

drop trigger if exists trg_set_updated_at_attendee_profiles on public.attendee_profiles;
create trigger trg_set_updated_at_attendee_profiles
before update on public.attendee_profiles
for each row execute procedure public.set_updated_at_timestamp();

drop trigger if exists trg_set_updated_at_orders on public.orders;
create trigger trg_set_updated_at_orders
before update on public.orders
for each row execute procedure public.set_updated_at_timestamp();

drop trigger if exists trg_set_updated_at_order_items on public.order_items;
create trigger trg_set_updated_at_order_items
before update on public.order_items
for each row execute procedure public.set_updated_at_timestamp();

drop trigger if exists trg_set_updated_at_order_item_attendees on public.order_item_attendees;
create trigger trg_set_updated_at_order_item_attendees
before update on public.order_item_attendees
for each row execute procedure public.set_updated_at_timestamp();

drop trigger if exists trg_set_updated_at_bookings on public.bookings;
create trigger trg_set_updated_at_bookings
before update on public.bookings
for each row execute procedure public.set_updated_at_timestamp();

drop trigger if exists trg_set_updated_at_booking_attendees on public.booking_attendees;
create trigger trg_set_updated_at_booking_attendees
before update on public.booking_attendees
for each row execute procedure public.set_updated_at_timestamp();

drop trigger if exists trg_set_updated_at_waitlist_entries on public.waitlist_entries;
create trigger trg_set_updated_at_waitlist_entries
before update on public.waitlist_entries
for each row execute procedure public.set_updated_at_timestamp();

drop trigger if exists trg_set_updated_at_payment_sessions on public.payment_sessions;
create trigger trg_set_updated_at_payment_sessions
before update on public.payment_sessions
for each row execute procedure public.set_updated_at_timestamp();

drop trigger if exists trg_set_updated_at_refunds on public.refunds;
create trigger trg_set_updated_at_refunds
before update on public.refunds
for each row execute procedure public.set_updated_at_timestamp();

create or replace function public.is_organizer_staff(
	p_organizer_id uuid,
	p_roles public.organizer_staff_role[] default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select
		public.is_platform_admin()
		or exists (
			select 1
			from public.organizer_memberships m
			where m.organizer_id = p_organizer_id
				and m.user_id = auth.uid()
				and (p_roles is null or m.role = any(p_roles))
		);
$$;

create or replace function public.is_event_public(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select exists (
		select 1
		from public.events e
		where e.id = p_event_id
			and e.status = 'published'
	);
$$;

create or replace function public.can_access_order(
	p_order_id uuid,
	p_staff_roles public.organizer_staff_role[] default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select exists (
		select 1
		from public.orders o
		where o.id = p_order_id
			and (
				public.is_platform_admin()
				or public.is_organizer_staff(o.organizer_id, p_staff_roles)
				or o.user_id = auth.uid()
				or (
					o.user_id is null
					and auth.uid() is not null
					and lower(coalesce(o.guest_email, '')) = public.current_auth_email()
				)
			)
	);
$$;

-- Concurrency strategy:
-- 1) lock event + ticket type rows (`for update`) in one transaction
-- 2) verify both capacities before incrementing confirmed counters
-- 3) only then write attendee slot confirmations
create or replace function public.reserve_ticket_capacity(
	p_ticket_type_id uuid,
	p_quantity integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
	v_event_id uuid;
	v_event_capacity integer;
	v_event_confirmed integer;
	v_ticket_capacity integer;
	v_ticket_confirmed integer;
begin
	if p_quantity <= 0 then
		raise exception 'quantity must be positive';
	end if;

	select
		e.id,
		e.capacity_total,
		e.confirmed_attendee_count,
		tt.capacity,
		tt.confirmed_attendee_count
	into
		v_event_id,
		v_event_capacity,
		v_event_confirmed,
		v_ticket_capacity,
		v_ticket_confirmed
	from public.event_ticket_types tt
	join public.events e on e.id = tt.event_id
	where tt.id = p_ticket_type_id
	for update of tt, e;

	if not found then
		raise exception 'ticket type not found: %', p_ticket_type_id;
	end if;

	if v_ticket_capacity is not null and v_ticket_confirmed + p_quantity > v_ticket_capacity then
		return false;
	end if;

	if v_event_capacity is not null and v_event_confirmed + p_quantity > v_event_capacity then
		return false;
	end if;

	update public.event_ticket_types
	set confirmed_attendee_count = confirmed_attendee_count + p_quantity
	where id = p_ticket_type_id;

	update public.events
	set confirmed_attendee_count = confirmed_attendee_count + p_quantity
	where id = v_event_id;

	return true;
end;
$$;

create or replace function public.release_ticket_capacity(
	p_ticket_type_id uuid,
	p_quantity integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	v_event_id uuid;
begin
	if p_quantity <= 0 then
		raise exception 'quantity must be positive';
	end if;

	select event_id
	into v_event_id
	from public.event_ticket_types
	where id = p_ticket_type_id
	for update;

	if not found then
		raise exception 'ticket type not found: %', p_ticket_type_id;
	end if;

	update public.event_ticket_types
	set confirmed_attendee_count = greatest(confirmed_attendee_count - p_quantity, 0)
	where id = p_ticket_type_id;

	update public.events
	set confirmed_attendee_count = greatest(confirmed_attendee_count - p_quantity, 0)
	where id = v_event_id;
end;
$$;

-- Webhook idempotency helper:
-- - unique(provider, provider_event_id) prevents duplicate processing rows
-- - caller can safely upsert retries/out-of-order deliveries
create or replace function public.upsert_payment_webhook_event(
	p_provider text,
	p_provider_event_id text,
	p_event_type text,
	p_payload jsonb
)
returns public.payment_webhook_events
language plpgsql
security definer
set search_path = public
as $$
declare
	v_row public.payment_webhook_events;
begin
	insert into public.payment_webhook_events (
		provider,
		provider_event_id,
		event_type,
		payload,
		processing_state
	)
	values (
		p_provider,
		p_provider_event_id,
		p_event_type,
		coalesce(p_payload, '{}'::jsonb),
		'received'
	)
	on conflict (provider, provider_event_id)
	do update set
		event_type = excluded.event_type,
		payload = excluded.payload
	returning * into v_row;

	return v_row;
end;
$$;

alter table public.organizers enable row level security;
alter table public.organizer_memberships enable row level security;
alter table public.locations enable row level security;
alter table public.cancellation_policies enable row level security;
alter table public.form_templates enable row level security;
alter table public.form_template_fields enable row level security;
alter table public.events enable row level security;
alter table public.event_sessions enable row level security;
alter table public.event_ticket_types enable row level security;
alter table public.discounts enable row level security;
alter table public.event_discounts enable row level security;
alter table public.attendee_profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_item_attendees enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_attendees enable row level security;
alter table public.waitlist_entries enable row level security;
alter table public.payment_sessions enable row level security;
alter table public.refunds enable row level security;
alter table public.payment_webhook_events enable row level security;
alter table public.check_in_records enable row level security;
alter table public.event_moderation_reviews enable row level security;
alter table public.admin_impersonation_sessions enable row level security;
alter table public.audit_log_entries enable row level security;

create policy organizers_select_staff_or_platform_admin
on public.organizers
for select
using (
	public.is_platform_admin()
	or public.is_organizer_staff(id)
);

create policy organizers_insert_platform_admin
on public.organizers
for insert
with check (public.is_platform_admin());

create policy organizers_update_admin_or_platform_admin
on public.organizers
for update
using (
	public.is_platform_admin()
	or public.is_organizer_staff(id, array['admin']::public.organizer_staff_role[])
)
with check (
	public.is_platform_admin()
	or public.is_organizer_staff(id, array['admin']::public.organizer_staff_role[])
);

create policy organizers_delete_platform_admin
on public.organizers
for delete
using (public.is_platform_admin());

create policy organizer_memberships_select_self_or_admin
on public.organizer_memberships
for select
using (
	public.is_platform_admin()
	or user_id = auth.uid()
	or public.is_organizer_staff(organizer_id, array['admin']::public.organizer_staff_role[])
);

create policy organizer_memberships_insert_admin
on public.organizer_memberships
for insert
with check (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id, array['admin']::public.organizer_staff_role[])
);

create policy organizer_memberships_update_admin
on public.organizer_memberships
for update
using (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id, array['admin']::public.organizer_staff_role[])
)
with check (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id, array['admin']::public.organizer_staff_role[])
);

create policy organizer_memberships_delete_admin
on public.organizer_memberships
for delete
using (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id, array['admin']::public.organizer_staff_role[])
);

create policy locations_select_staff
on public.locations
for select
using (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id)
);

create policy locations_manage_editor
on public.locations
for all
using (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id, array['admin', 'editor']::public.organizer_staff_role[])
)
with check (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id, array['admin', 'editor']::public.organizer_staff_role[])
);

create policy cancellation_policies_select_staff
on public.cancellation_policies
for select
using (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id)
);

create policy cancellation_policies_manage_editor
on public.cancellation_policies
for all
using (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id, array['admin', 'editor']::public.organizer_staff_role[])
)
with check (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id, array['admin', 'editor']::public.organizer_staff_role[])
);

create policy form_templates_select_staff
on public.form_templates
for select
using (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id)
);

create policy form_templates_manage_editor
on public.form_templates
for all
using (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id, array['admin', 'editor']::public.organizer_staff_role[])
)
with check (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id, array['admin', 'editor']::public.organizer_staff_role[])
);

create policy form_template_fields_select_staff
on public.form_template_fields
for select
using (
	public.is_platform_admin()
	or exists (
		select 1
		from public.form_templates t
		where t.id = template_id
			and public.is_organizer_staff(t.organizer_id)
	)
);

create policy form_template_fields_manage_editor
on public.form_template_fields
for all
using (
	public.is_platform_admin()
	or exists (
		select 1
		from public.form_templates t
		where t.id = template_id
			and public.is_organizer_staff(
				t.organizer_id,
				array['admin', 'editor']::public.organizer_staff_role[]
			)
	)
)
with check (
	public.is_platform_admin()
	or exists (
		select 1
		from public.form_templates t
		where t.id = template_id
			and public.is_organizer_staff(
				t.organizer_id,
				array['admin', 'editor']::public.organizer_staff_role[]
			)
	)
);

create policy events_select_public_or_staff
on public.events
for select
using (
	status = 'published'
	or public.is_platform_admin()
	or public.is_organizer_staff(organizer_id)
);

create policy events_manage_editor
on public.events
for all
using (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id, array['admin', 'editor']::public.organizer_staff_role[])
)
with check (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id, array['admin', 'editor']::public.organizer_staff_role[])
);

create policy event_sessions_select_public_or_staff
on public.event_sessions
for select
using (
	public.is_event_public(event_id)
	or public.is_platform_admin()
	or exists (
		select 1
		from public.events e
		where e.id = event_id
			and public.is_organizer_staff(e.organizer_id)
	)
);

create policy event_sessions_manage_editor
on public.event_sessions
for all
using (
	public.is_platform_admin()
	or exists (
		select 1
		from public.events e
		where e.id = event_id
			and public.is_organizer_staff(
				e.organizer_id,
				array['admin', 'editor']::public.organizer_staff_role[]
			)
	)
)
with check (
	public.is_platform_admin()
	or exists (
		select 1
		from public.events e
		where e.id = event_id
			and public.is_organizer_staff(
				e.organizer_id,
				array['admin', 'editor']::public.organizer_staff_role[]
			)
	)
);

create policy event_ticket_types_select_public_or_staff
on public.event_ticket_types
for select
using (
	public.is_event_public(event_id)
	or public.is_platform_admin()
	or exists (
		select 1
		from public.events e
		where e.id = event_id
			and public.is_organizer_staff(e.organizer_id)
	)
);

create policy event_ticket_types_manage_editor
on public.event_ticket_types
for all
using (
	public.is_platform_admin()
	or exists (
		select 1
		from public.events e
		where e.id = event_id
			and public.is_organizer_staff(
				e.organizer_id,
				array['admin', 'editor']::public.organizer_staff_role[]
			)
	)
)
with check (
	public.is_platform_admin()
	or exists (
		select 1
		from public.events e
		where e.id = event_id
			and public.is_organizer_staff(
				e.organizer_id,
				array['admin', 'editor']::public.organizer_staff_role[]
			)
	)
);

create policy discounts_select_staff
on public.discounts
for select
using (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id)
);

create policy discounts_manage_editor
on public.discounts
for all
using (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id, array['admin', 'editor']::public.organizer_staff_role[])
)
with check (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id, array['admin', 'editor']::public.organizer_staff_role[])
);

create policy event_discounts_select_public_or_staff
on public.event_discounts
for select
using (
	public.is_platform_admin()
	or public.is_event_public(event_id)
	or exists (
		select 1
		from public.events e
		where e.id = event_id
			and public.is_organizer_staff(e.organizer_id)
	)
);

create policy event_discounts_manage_editor
on public.event_discounts
for all
using (
	public.is_platform_admin()
	or exists (
		select 1
		from public.events e
		where e.id = event_id
			and public.is_organizer_staff(
				e.organizer_id,
				array['admin', 'editor']::public.organizer_staff_role[]
			)
	)
)
with check (
	public.is_platform_admin()
	or exists (
		select 1
		from public.events e
		where e.id = event_id
			and public.is_organizer_staff(
				e.organizer_id,
				array['admin', 'editor']::public.organizer_staff_role[]
			)
	)
);

create policy attendee_profiles_owner_access
on public.attendee_profiles
for select
using (owner_user_id = auth.uid());

create policy attendee_profiles_owner_insert
on public.attendee_profiles
for insert
with check (owner_user_id = auth.uid());

create policy attendee_profiles_owner_update
on public.attendee_profiles
for update
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

create policy attendee_profiles_owner_delete
on public.attendee_profiles
for delete
using (owner_user_id = auth.uid());

create policy orders_select_owner_or_staff
on public.orders
for select
using (public.can_access_order(id));

create policy orders_insert_guest_or_owner_or_staff
on public.orders
for insert
with check (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id, array['admin', 'editor']::public.organizer_staff_role[])
	or (user_id is not null and user_id = auth.uid())
	or (user_id is null and guest_email is not null)
);

create policy orders_update_owner_or_staff
on public.orders
for update
using (public.can_access_order(id))
with check (
	public.can_access_order(id)
	or public.is_platform_admin()
);

create policy orders_delete_admin
on public.orders
for delete
using (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id, array['admin']::public.organizer_staff_role[])
);

create policy order_items_select_owner_or_staff
on public.order_items
for select
using (public.can_access_order(order_id));

create policy order_items_manage_owner_or_staff
on public.order_items
for all
using (public.can_access_order(order_id))
with check (public.can_access_order(order_id));

create policy order_item_attendees_select_owner_or_staff
on public.order_item_attendees
for select
using (
	exists (
		select 1
		from public.order_items oi
		where oi.id = order_item_id
			and public.can_access_order(oi.order_id)
	)
);

create policy order_item_attendees_manage_owner_or_staff
on public.order_item_attendees
for all
using (
	exists (
		select 1
		from public.order_items oi
		where oi.id = order_item_id
			and public.can_access_order(oi.order_id)
	)
)
with check (
	exists (
		select 1
		from public.order_items oi
		where oi.id = order_item_id
			and public.can_access_order(oi.order_id)
	)
);

create policy bookings_select_owner_or_staff
on public.bookings
for select
using (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id)
	or (order_id is not null and public.can_access_order(order_id))
);

create policy bookings_manage_staff
on public.bookings
for all
using (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id, array['admin', 'editor']::public.organizer_staff_role[])
)
with check (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id, array['admin', 'editor']::public.organizer_staff_role[])
);

create policy booking_attendees_select_owner_or_staff
on public.booking_attendees
for select
using (
	exists (
		select 1
		from public.bookings b
		where b.id = booking_id
			and (
				public.is_platform_admin()
				or public.is_organizer_staff(b.organizer_id)
				or (b.order_id is not null and public.can_access_order(b.order_id))
			)
	)
);

create policy booking_attendees_manage_staff
on public.booking_attendees
for all
using (
	exists (
		select 1
		from public.bookings b
		where b.id = booking_id
			and (
				public.is_platform_admin()
				or public.is_organizer_staff(
					b.organizer_id,
					array['admin', 'editor', 'check_in']::public.organizer_staff_role[]
				)
			)
	)
)
with check (
	exists (
		select 1
		from public.bookings b
		where b.id = booking_id
			and (
				public.is_platform_admin()
				or public.is_organizer_staff(
					b.organizer_id,
					array['admin', 'editor', 'check_in']::public.organizer_staff_role[]
				)
			)
	)
);

create policy waitlist_select_owner_or_staff
on public.waitlist_entries
for select
using (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id)
	or user_id = auth.uid()
	or (user_id is null and guest_email is not null and public.current_auth_email() = lower(guest_email))
);

create policy waitlist_insert_guest_or_owner_or_staff
on public.waitlist_entries
for insert
with check (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id, array['admin', 'editor']::public.organizer_staff_role[])
	or user_id = auth.uid()
	or (user_id is null and guest_email is not null)
);

create policy waitlist_update_owner_or_staff
on public.waitlist_entries
for update
using (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id, array['admin', 'editor']::public.organizer_staff_role[])
	or user_id = auth.uid()
)
with check (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id, array['admin', 'editor']::public.organizer_staff_role[])
	or user_id = auth.uid()
);

create policy waitlist_delete_owner_or_staff
on public.waitlist_entries
for delete
using (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id, array['admin', 'editor']::public.organizer_staff_role[])
	or user_id = auth.uid()
);

create policy payment_sessions_select_owner_or_staff
on public.payment_sessions
for select
using (public.can_access_order(order_id));

create policy payment_sessions_manage_staff
on public.payment_sessions
for all
using (
	exists (
		select 1
		from public.orders o
		where o.id = order_id
			and (
				public.is_platform_admin()
				or public.is_organizer_staff(
					o.organizer_id,
					array['admin', 'editor']::public.organizer_staff_role[]
				)
			)
	)
)
with check (
	exists (
		select 1
		from public.orders o
		where o.id = order_id
			and (
				public.is_platform_admin()
				or public.is_organizer_staff(
					o.organizer_id,
					array['admin', 'editor']::public.organizer_staff_role[]
				)
			)
	)
);

create policy refunds_select_owner_or_staff
on public.refunds
for select
using (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id)
	or public.can_access_order(order_id)
);

create policy refunds_manage_staff
on public.refunds
for all
using (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id, array['admin', 'editor']::public.organizer_staff_role[])
)
with check (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id, array['admin', 'editor']::public.organizer_staff_role[])
);

-- no explicit policies: service role only for webhook ingestion

create policy check_in_records_select_owner_or_staff
on public.check_in_records
for select
using (
	public.is_platform_admin()
	or public.is_organizer_staff(organizer_id)
	or exists (
		select 1
		from public.booking_attendees ba
		join public.bookings b on b.id = ba.booking_id
		where ba.id = booking_attendee_id
			and b.order_id is not null
			and public.can_access_order(b.order_id)
	)
);

create policy check_in_records_manage_staff
on public.check_in_records
for all
using (
	public.is_platform_admin()
	or public.is_organizer_staff(
		organizer_id,
		array['admin', 'editor', 'check_in']::public.organizer_staff_role[]
	)
)
with check (
	public.is_platform_admin()
	or public.is_organizer_staff(
		organizer_id,
		array['admin', 'editor', 'check_in']::public.organizer_staff_role[]
	)
);

create policy event_moderation_reviews_select_staff_or_platform_admin
on public.event_moderation_reviews
for select
using (
	public.is_platform_admin()
	or exists (
		select 1
		from public.events e
		where e.id = event_id
			and public.is_organizer_staff(e.organizer_id)
	)
);

create policy event_moderation_reviews_manage_platform_admin
on public.event_moderation_reviews
for all
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy admin_impersonation_sessions_platform_admin
on public.admin_impersonation_sessions
for all
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy audit_log_entries_platform_admin_or_org_admin
on public.audit_log_entries
for select
using (
	public.is_platform_admin()
	or (
		organizer_id is not null
		and public.is_organizer_staff(organizer_id, array['admin']::public.organizer_staff_role[])
	)
);

create policy audit_log_entries_insert_platform_admin
on public.audit_log_entries
for insert
with check (public.is_platform_admin());
