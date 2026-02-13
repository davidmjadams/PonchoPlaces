-- Deterministic fixture helper for Cucumber + Playwright e2e tests.
-- This function is intentionally explicit with IDs to make Gherkin data stable.
create or replace function public.seed_event_booking_e2e(p_seed text default 'baseline')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	v_seed text := lower(coalesce(p_seed, 'baseline'));
	v_seeded_user_id uuid;
begin
	if v_seed <> 'baseline' then
		raise exception 'Unknown seed profile: %', p_seed;
	end if;

	truncate table
		public.audit_log_entries,
		public.admin_impersonation_sessions,
		public.event_moderation_reviews,
		public.check_in_records,
		public.payment_webhook_events,
		public.refunds,
		public.payment_sessions,
		public.waitlist_entries,
		public.booking_attendees,
		public.bookings,
		public.order_item_attendees,
		public.order_items,
		public.orders,
		public.event_discounts,
		public.discounts,
		public.event_ticket_types,
		public.event_sessions,
		public.events,
		public.form_template_fields,
		public.form_templates,
		public.cancellation_policies,
		public.locations,
		public.organizer_memberships,
		public.organizers
	restart identity cascade;

	insert into public.organizers (id, slug, name, default_timezone, allow_guest_checkout, status)
	values
		('00000000-0000-0000-0000-000000000101', 'little-acorns', 'Little Acorns', 'Europe/London', true, 'active'),
		('00000000-0000-0000-0000-000000000102', 'riverdale-kids', 'Riverdale Kids', 'Europe/London', true, 'active');

	insert into public.locations (id, organizer_id, name, city, postcode, country_code, timezone)
	values
		('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000101', 'Little Acorns Hall', 'London', 'N1 1AA', 'GB', 'Europe/London'),
		('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000101', 'Little Acorns Studio', 'London', 'N1 2BB', 'GB', 'Europe/London'),
		('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000102', 'Riverdale Sports Dome', 'Manchester', 'M1 3CC', 'GB', 'Europe/London');

	insert into public.cancellation_policies (
		id,
		organizer_id,
		name,
		policy_text,
		refund_window_hours,
		default_refund_percent,
		allow_partial_refunds
	)
	values (
		'00000000-0000-0000-0000-000000000401',
		'00000000-0000-0000-0000-000000000101',
		'Little Acorns Standard',
		'Full refund up to 48 hours before session start, then no refund.',
		48,
		100,
		true
	);

	insert into public.form_templates (id, organizer_id, name, applies_to, version, is_active)
	values
		(
			'00000000-0000-0000-0000-000000000501',
			'00000000-0000-0000-0000-000000000101',
			'Little Acorns Default Booking Form',
			'organizer_default',
			1,
			true
		),
		(
			'00000000-0000-0000-0000-000000000502',
			'00000000-0000-0000-0000-000000000101',
			'Camp Booking Form',
			'event_type_default',
			1,
			true
		);

	insert into public.form_template_fields (
		id,
		template_id,
		scope,
		field_key,
		label,
		field_type,
		sort_order,
		required,
		conditional_logic
	)
	values
		('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000501', 'booking', 'parent_name', 'Parent full name', 'text', 1, true, '{}'::jsonb),
		('00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000501', 'booking', 'parent_email', 'Parent email', 'email', 2, true, '{}'::jsonb),
		('00000000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-000000000501', 'attendee', 'attendee_name', 'Child name', 'text', 1, true, '{}'::jsonb),
		('00000000-0000-0000-0000-000000000604', '00000000-0000-0000-0000-000000000501', 'attendee', 'attendee_dob', 'Date of birth', 'dob', 2, false, '{}'::jsonb),
		('00000000-0000-0000-0000-000000000605', '00000000-0000-0000-0000-000000000501', 'booking', 'consent_safeguarding', 'I agree to safeguarding terms', 'checkbox', 3, false, '{}'::jsonb),
		('00000000-0000-0000-0000-000000000606', '00000000-0000-0000-0000-000000000502', 'attendee', 'allergy_notes', 'Allergy notes', 'text', 3, false, '{}'::jsonb),
		('00000000-0000-0000-0000-000000000607', '00000000-0000-0000-0000-000000000502', 'booking', 'gdpr_consent', 'GDPR consent', 'gdpr_consent', 4, true, '{}'::jsonb);

	insert into public.events (
		id,
		organizer_id,
		slug,
		title,
		description,
		event_type,
		status,
		timezone,
		location_id,
		capacity_total,
		waitlist_enabled,
		waitlist_capacity,
		cancellation_policy_id,
		form_template_id,
		safeguarding_ack_required,
		starts_at,
		ends_at
	)
	values
		(
			'11111111-1111-1111-1111-111111111001',
			'00000000-0000-0000-0000-000000000101',
			'half-term-camp-2026',
			'Half Term Camp',
			'Multi-day holiday camp with arts and outdoor play.',
			'camp_multi_day',
			'published',
			'Europe/London',
			'00000000-0000-0000-0000-000000000301',
			40,
			true,
			25,
			'00000000-0000-0000-0000-000000000401',
			'00000000-0000-0000-0000-000000000502',
			true,
			'2026-02-17T09:00:00+00',
			'2026-02-19T16:00:00+00'
		),
		(
			'11111111-1111-1111-1111-111111111002',
			'00000000-0000-0000-0000-000000000101',
			'toddler-music-monday',
			'Toddler Music Monday',
			'Single-session music and movement class.',
			'single_session',
			'published',
			'Europe/London',
			'00000000-0000-0000-0000-000000000302',
			18,
			true,
			10,
			'00000000-0000-0000-0000-000000000401',
			'00000000-0000-0000-0000-000000000501',
			false,
			'2026-02-23T10:00:00+00',
			'2026-02-23T11:00:00+00'
		),
		(
			'11111111-1111-1111-1111-111111111003',
			'00000000-0000-0000-0000-000000000101',
			'art-explorers-course',
			'Art Explorers Course',
			'Four-week multi-session art course.',
			'course_multi_session',
			'published',
			'Europe/London',
			'00000000-0000-0000-0000-000000000302',
			20,
			true,
			10,
			'00000000-0000-0000-0000-000000000401',
			'00000000-0000-0000-0000-000000000501',
			false,
			null,
			null
		),
		(
			'11111111-1111-1111-1111-111111111004',
			'00000000-0000-0000-0000-000000000101',
			'saturday-drop-in-football',
			'Saturday Drop-In Football',
			'Weekly recurring drop-in session.',
			'recurring_drop_in',
			'published',
			'Europe/London',
			'00000000-0000-0000-0000-000000000301',
			30,
			true,
			20,
			'00000000-0000-0000-0000-000000000401',
			'00000000-0000-0000-0000-000000000501',
			false,
			null,
			null
		),
		(
			'11111111-1111-1111-1111-111111111005',
			'00000000-0000-0000-0000-000000000102',
			'riverdale-swim-intro',
			'Riverdale Swim Intro',
			'Cross-tenant fixture event.',
			'single_session',
			'published',
			'Europe/London',
			'00000000-0000-0000-0000-000000000303',
			12,
			true,
			8,
			null,
			null,
			false,
			'2026-02-22T14:00:00+00',
			'2026-02-22T15:00:00+00'
		),
		(
			'11111111-1111-1111-1111-111111111006',
			'00000000-0000-0000-0000-000000000101',
			'internal-staff-session',
			'Internal Staff Session',
			'Unpublished internal planning event.',
			'single_session',
			'draft',
			'Europe/London',
			'00000000-0000-0000-0000-000000000301',
			8,
			false,
			null,
			'00000000-0000-0000-0000-000000000401',
			'00000000-0000-0000-0000-000000000501',
			false,
			'2026-02-24T14:00:00+00',
			'2026-02-24T15:00:00+00'
		);

	insert into public.event_sessions (id, event_id, starts_at, ends_at, is_all_day, status)
	values
		('22222222-2222-2222-2222-222222222101', '11111111-1111-1111-1111-111111111001', '2026-02-17T09:00:00+00', '2026-02-17T16:00:00+00', false, 'scheduled'),
		('22222222-2222-2222-2222-222222222102', '11111111-1111-1111-1111-111111111001', '2026-02-18T09:00:00+00', '2026-02-18T16:00:00+00', false, 'scheduled'),
		('22222222-2222-2222-2222-222222222103', '11111111-1111-1111-1111-111111111001', '2026-02-19T09:00:00+00', '2026-02-19T16:00:00+00', false, 'scheduled'),
		('22222222-2222-2222-2222-222222222104', '11111111-1111-1111-1111-111111111002', '2026-02-23T10:00:00+00', '2026-02-23T11:00:00+00', false, 'scheduled'),
		('22222222-2222-2222-2222-222222222105', '11111111-1111-1111-1111-111111111003', '2026-03-01T10:00:00+00', '2026-03-01T11:30:00+00', false, 'scheduled'),
		('22222222-2222-2222-2222-222222222106', '11111111-1111-1111-1111-111111111003', '2026-03-08T10:00:00+00', '2026-03-08T11:30:00+00', false, 'scheduled'),
		('22222222-2222-2222-2222-222222222107', '11111111-1111-1111-1111-111111111004', '2026-02-21T09:00:00+00', '2026-02-21T10:00:00+00', false, 'scheduled'),
		('22222222-2222-2222-2222-222222222108', '11111111-1111-1111-1111-111111111004', '2026-02-28T09:00:00+00', '2026-02-28T10:00:00+00', false, 'scheduled');

	insert into public.event_ticket_types (
		id,
		event_id,
		name,
		unit_price_pence,
		capacity,
		min_per_booking,
		max_per_booking,
		is_active
	)
	values
		('33333333-3333-3333-3333-333333333101', '11111111-1111-1111-1111-111111111001', 'Camp Standard', 4500, 30, 1, 10, true),
		('33333333-3333-3333-3333-333333333102', '11111111-1111-1111-1111-111111111001', 'Camp Sibling', 3800, 10, 1, 10, true),
		('33333333-3333-3333-3333-333333333103', '11111111-1111-1111-1111-111111111002', 'General Admission', 1200, 18, 1, 4, true),
		('33333333-3333-3333-3333-333333333104', '11111111-1111-1111-1111-111111111003', 'Course Pass', 8000, 20, 1, 3, true),
		('33333333-3333-3333-3333-333333333105', '11111111-1111-1111-1111-111111111004', 'Drop-In', 1500, 30, 1, 6, true);

	insert into public.discounts (
		id,
		organizer_id,
		code,
		name,
		discount_type,
		combination_mode,
		priority,
		is_active,
		starts_at,
		ends_at,
		config
	)
	values
		(
			'44444444-4444-4444-4444-444444444101',
			'00000000-0000-0000-0000-000000000101',
			'EARLY20',
			'Early bird 20%',
			'early_bird',
			'exclusive',
			10,
			true,
			'2026-01-01T00:00:00+00',
			'2026-02-15T23:59:59+00',
			'{"type":"percentage","value":20}'::jsonb
		),
		(
			'44444444-4444-4444-4444-444444444102',
			'00000000-0000-0000-0000-000000000101',
			'SIBLING10',
			'Sibling 10%',
			'siblings',
			'exclusive',
			20,
			true,
			null,
			null,
			'{"type":"percentage","value":10,"min_attendees":2}'::jsonb
		),
		(
			'44444444-4444-4444-4444-444444444103',
			'00000000-0000-0000-0000-000000000101',
			'GROUPTIER',
			'Group tier discount',
			'group_tier',
			'exclusive',
			30,
			true,
			null,
			null,
			'{"tiers":[{"min":3,"discount_percent":5},{"min":5,"discount_percent":10}]}'::jsonb
		);

	insert into public.event_discounts (event_id, discount_id)
	values
		('11111111-1111-1111-1111-111111111001', '44444444-4444-4444-4444-444444444101'),
		('11111111-1111-1111-1111-111111111001', '44444444-4444-4444-4444-444444444102'),
		('11111111-1111-1111-1111-111111111001', '44444444-4444-4444-4444-444444444103'),
		('11111111-1111-1111-1111-111111111002', '44444444-4444-4444-4444-444444444102');

	insert into public.orders (
		id,
		organizer_id,
		user_id,
		guest_email,
		guest_name,
		currency_code,
		state,
		subtotal_pence,
		discount_total_pence,
		total_pence,
		ponchopay_checkout_session_id,
		idempotency_key,
		checkout_started_at
	)
	values
		(
			'55555555-5555-5555-5555-555555555101',
			'00000000-0000-0000-0000-000000000101',
			null,
			'guest1@example.com',
			'Guest Parent One',
			'GBP',
			'pending_payment',
			2400,
			0,
			2400,
			'pps_test_0001',
			'order-seed-0001',
			'2026-02-01T10:00:00+00'
		),
		(
			'55555555-5555-5555-5555-555555555102',
			'00000000-0000-0000-0000-000000000101',
			null,
			'guest2@example.com',
			'Guest Parent Two',
			'GBP',
			'paid',
			4500,
			500,
			4000,
			'pps_test_0002',
			'order-seed-0002',
			'2026-02-01T12:00:00+00'
		),
		(
			'55555555-5555-5555-5555-555555555103',
			'00000000-0000-0000-0000-000000000101',
			null,
			'guest-draft@example.com',
			'Guest Parent Draft',
			'GBP',
			'draft',
			0,
			0,
			0,
			null,
			'order-seed-0003',
			null
		);

	insert into public.order_items (
		id,
		order_id,
		event_id,
		event_session_id,
		ticket_type_id,
		quantity,
		unit_price_pence,
		discount_total_pence,
		line_total_pence
	)
	values
		(
			'66666666-6666-6666-6666-666666666101',
			'55555555-5555-5555-5555-555555555101',
			'11111111-1111-1111-1111-111111111002',
			'22222222-2222-2222-2222-222222222104',
			'33333333-3333-3333-3333-333333333103',
			2,
			1200,
			0,
			2400
		),
		(
			'66666666-6666-6666-6666-666666666102',
			'55555555-5555-5555-5555-555555555102',
			'11111111-1111-1111-1111-111111111001',
			'22222222-2222-2222-2222-222222222101',
			'33333333-3333-3333-3333-333333333101',
			1,
			4500,
			500,
			4000
		);

	insert into public.order_item_attendees (
		id,
		order_item_id,
		attendee_name,
		attendee_dob,
		state,
		hold_expires_at
	)
	values
		(
			'77777777-7777-7777-7777-777777777101',
			'66666666-6666-6666-6666-666666666101',
			'Elliot Example',
			'2021-05-10',
			'held',
			'2026-02-01T10:15:00+00'
		),
		(
			'77777777-7777-7777-7777-777777777102',
			'66666666-6666-6666-6666-666666666101',
			'Poppy Example',
			'2020-08-21',
			'held',
			'2026-02-01T10:15:00+00'
		),
		(
			'77777777-7777-7777-7777-777777777103',
			'66666666-6666-6666-6666-666666666102',
			'Noah Example',
			'2018-03-02',
			'confirmed',
			null
		);

	insert into public.bookings (
		id,
		organizer_id,
		order_id,
		order_item_id,
		event_id,
		event_session_id,
		booked_by_user_id,
		guest_email,
		state,
		booking_reference,
		confirmed_at
	)
	values
		(
			'88888888-8888-8888-8888-888888888101',
			'00000000-0000-0000-0000-000000000101',
			'55555555-5555-5555-5555-555555555102',
			'66666666-6666-6666-6666-666666666102',
			'11111111-1111-1111-1111-111111111001',
			'22222222-2222-2222-2222-222222222101',
			null,
			'guest2@example.com',
			'confirmed',
			'LA-BOOK-0001',
			'2026-02-01T12:05:00+00'
		),
		(
			'88888888-8888-8888-8888-888888888102',
			'00000000-0000-0000-0000-000000000102',
			null,
			null,
			'11111111-1111-1111-1111-111111111005',
			null,
			null,
			'river.parent@example.com',
			'confirmed',
			'RD-BOOK-0001',
			'2026-02-02T09:10:00+00'
		);

	insert into public.booking_attendees (
		id,
		booking_id,
		order_item_attendee_id,
		attendee_name,
		attendee_dob,
		state
	)
	values
		(
			'99999999-9999-9999-9999-999999999101',
			'88888888-8888-8888-8888-888888888101',
			'77777777-7777-7777-7777-777777777103',
			'Noah Example',
			'2018-03-02',
			'confirmed'
		),
		(
			'99999999-9999-9999-9999-999999999102',
			'88888888-8888-8888-8888-888888888102',
			null,
			'River Example',
			'2017-11-11',
			'confirmed'
		);

	insert into public.payment_sessions (
		id,
		order_id,
		provider,
		provider_session_id,
		provider_intent_id,
		status,
		redirect_url,
		amount_pence,
		currency_code,
		idempotency_key
	)
	values
		(
			'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa101',
			'55555555-5555-5555-5555-555555555101',
			'ponchopay',
			'pps_test_0001',
			'ppi_test_0001',
			'created',
			'https://checkout.ponchopay.example/session/pps_test_0001',
			2400,
			'GBP',
			'pp-idem-0001'
		),
		(
			'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa102',
			'55555555-5555-5555-5555-555555555102',
			'ponchopay',
			'pps_test_0002',
			'ppi_test_0002',
			'succeeded',
			'https://checkout.ponchopay.example/session/pps_test_0002',
			4000,
			'GBP',
			'pp-idem-0002'
		);

	insert into public.payment_webhook_events (
		id,
		provider,
		provider_event_id,
		event_type,
		order_id,
		payment_session_id,
		payload,
		processing_state,
		processed_at
	)
	values
		(
			'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb101',
			'ponchopay',
			'evt_test_payment_succeeded_0002',
			'payment_succeeded',
			'55555555-5555-5555-5555-555555555102',
			'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa102',
			'{"order_id":"55555555-5555-5555-5555-555555555102"}'::jsonb,
			'processed',
			'2026-02-01T12:05:05+00'
		);

	insert into public.waitlist_entries (
		id,
		organizer_id,
		event_id,
		event_session_id,
		ticket_type_id,
		order_id,
		user_id,
		guest_email,
		attendee_name,
		state,
		created_at
	)
	values
		(
			'cccccccc-cccc-cccc-cccc-ccccccccc101',
			'00000000-0000-0000-0000-000000000101',
			'11111111-1111-1111-1111-111111111002',
			'22222222-2222-2222-2222-222222222104',
			'33333333-3333-3333-3333-333333333103',
			null,
			null,
			'waitlist.parent@example.com',
			'Waiting Child',
			'waiting',
			now()
		);

	insert into public.refunds (
		id,
		organizer_id,
		order_id,
		booking_attendee_id,
		provider_refund_id,
		amount_pence,
		reason,
		status
	)
	values
		(
			'dddddddd-dddd-dddd-dddd-ddddddddd101',
			'00000000-0000-0000-0000-000000000101',
			'55555555-5555-5555-5555-555555555102',
			'99999999-9999-9999-9999-999999999101',
			'pp_ref_0001',
			1000,
			'Partial attendee refund fixture',
			'succeeded'
		);

	insert into public.check_in_records (
		id,
		organizer_id,
		booking_attendee_id,
		checked_in_by_user_id,
		checked_in_at,
		notes
	)
	values
		(
			'eeeeeeee-eeee-eeee-eeee-eeeeeeeee101',
			'00000000-0000-0000-0000-000000000101',
			'99999999-9999-9999-9999-999999999101',
			null,
			'2026-02-17T09:05:00+00',
			'Fixture check-in row'
		);

	insert into public.event_moderation_reviews (
		id,
		event_id,
		reviewer_user_id,
		state,
		notes,
		reviewed_at
	)
	values
		(
			'ffffffff-ffff-ffff-ffff-fffffffff101',
			'11111111-1111-1111-1111-111111111001',
			null,
			'approved',
			'Auto-approved fixture moderation row',
			'2026-02-01T08:00:00+00'
		);

	insert into public.audit_log_entries (
		id,
		organizer_id,
		actor_user_id,
		actor_role,
		action,
		target_table,
		target_id,
		metadata,
		correlation_id,
		occurred_at
	)
	values
		(
			'abcdabcd-abcd-abcd-abcd-abcdabcd0101',
			'00000000-0000-0000-0000-000000000101',
			null,
			'seed',
			'seed_event_booking_e2e',
			'events',
			'11111111-1111-1111-1111-111111111001',
			'{"note":"baseline fixtures loaded"}'::jsonb,
			'seed-baseline-0001',
			now()
		);

	select id
	into v_seeded_user_id
	from auth.users
	where lower(email) = 'davidmjadams+test@gmail.com'
	limit 1;

	if v_seeded_user_id is not null then
		insert into public.organizer_memberships (id, organizer_id, user_id, role)
		values
			(gen_random_uuid(), '00000000-0000-0000-0000-000000000101', v_seeded_user_id, 'admin'),
			(gen_random_uuid(), '00000000-0000-0000-0000-000000000101', v_seeded_user_id, 'editor'),
			(gen_random_uuid(), '00000000-0000-0000-0000-000000000101', v_seeded_user_id, 'check_in')
		on conflict do nothing;
	end if;
end;
$$;
