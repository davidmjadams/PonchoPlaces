import process from 'node:process';

import { createClient } from '@supabase/supabase-js';

async function main() {
	const seedName = process.argv[2] ?? 'baseline';
	const supabaseUrl = process.env.E2E_SUPABASE_URL ?? process.env.PUBLIC_SUPABASE_URL;
	const serviceRoleKey = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl) {
		throw new Error('Missing E2E_SUPABASE_URL or PUBLIC_SUPABASE_URL');
	}
	if (!serviceRoleKey || serviceRoleKey.trim().length === 0) {
		throw new Error('Missing E2E_SUPABASE_SERVICE_ROLE_KEY');
	}

	const admin = createClient(supabaseUrl, serviceRoleKey, {
		auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
	});

	const { error } = await admin.rpc('seed_event_booking_e2e', { p_seed: seedName });
	if (error) {
		throw new Error(`Failed to seed event booking fixtures: ${error.message}`);
	}

	console.log(`[seed-event-booking] loaded seed profile "${seedName}"`);
}

await main();
