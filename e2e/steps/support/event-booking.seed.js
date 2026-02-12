import { createClient } from '@supabase/supabase-js';

let warnedMissingAdminEnv = false;

/**
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
function getAdminClientOrNull() {
	const supabaseUrl = process.env.E2E_SUPABASE_URL ?? process.env.PUBLIC_SUPABASE_URL;
	const serviceRoleKey = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !serviceRoleKey || serviceRoleKey.trim().length === 0) {
		if (!warnedMissingAdminEnv) {
			console.warn(
				'[e2e:event-booking] Missing E2E_SUPABASE_URL or E2E_SUPABASE_SERVICE_ROLE_KEY; DB-backed assertions are no-op.'
			);
			warnedMissingAdminEnv = true;
		}
		return null;
	}

	return createClient(supabaseUrl, serviceRoleKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
			detectSessionInUrl: false
		}
	});
}

/**
 * @param {string} seedName
 */
export async function loadDeterministicSeed(seedName) {
	const admin = getAdminClientOrNull();
	if (!admin) return;

	const { error } = await admin.rpc('seed_event_booking_e2e', { p_seed: seedName });
	if (error) {
		throw new Error(`[e2e:event-booking] failed to seed fixtures: ${error.message}`);
	}
}

/**
 * @param {string} orderId
 * @returns {Promise<string | null>}
 */
export async function fetchOrderState(orderId) {
	const admin = getAdminClientOrNull();
	if (!admin) return null;

	const { data, error } = await admin.from('orders').select('state').eq('id', orderId).maybeSingle();
	if (error) throw new Error(`[e2e:event-booking] failed to fetch order ${orderId}: ${error.message}`);
	return data?.state ?? null;
}

/**
 * @param {string} bookingId
 * @returns {Promise<string | null>}
 */
export async function fetchBookingState(bookingId) {
	const admin = getAdminClientOrNull();
	if (!admin) return null;

	const { data, error } = await admin.from('bookings').select('state').eq('id', bookingId).maybeSingle();
	if (error) throw new Error(`[e2e:event-booking] failed to fetch booking ${bookingId}: ${error.message}`);
	return data?.state ?? null;
}

/**
 * @param {string} attendeeSlotId
 * @returns {Promise<string | null>}
 */
export async function fetchAttendeeSlotState(attendeeSlotId) {
	const admin = getAdminClientOrNull();
	if (!admin) return null;

	const { data, error } = await admin
		.from('order_item_attendees')
		.select('state')
		.eq('id', attendeeSlotId)
		.maybeSingle();

	if (error) {
		throw new Error(
			`[e2e:event-booking] failed to fetch attendee slot ${attendeeSlotId}: ${error.message}`
		);
	}
	return data?.state ?? null;
}

/**
 * @param {string} waitlistEntryId
 * @returns {Promise<string | null>}
 */
export async function fetchWaitlistState(waitlistEntryId) {
	const admin = getAdminClientOrNull();
	if (!admin) return null;

	const { data, error } = await admin
		.from('waitlist_entries')
		.select('state')
		.eq('id', waitlistEntryId)
		.maybeSingle();

	if (error) {
		throw new Error(
			`[e2e:event-booking] failed to fetch waitlist entry ${waitlistEntryId}: ${error.message}`
		);
	}
	return data?.state ?? null;
}

/**
 * @param {string} providerEventId
 * @returns {Promise<{ provider_event_id: string; processing_state: string } | null>}
 */
export async function fetchWebhookEvent(providerEventId) {
	const admin = getAdminClientOrNull();
	if (!admin) return null;

	const { data, error } = await admin
		.from('payment_webhook_events')
		.select('provider_event_id,processing_state')
		.eq('provider_event_id', providerEventId)
		.maybeSingle();

	if (error) {
		throw new Error(
			`[e2e:event-booking] failed to fetch webhook ${providerEventId}: ${error.message}`
		);
	}

	return data ?? null;
}
