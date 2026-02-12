import process from 'node:process';

import { createClient } from '@supabase/supabase-js';

import { run } from '../_shared/exec.mjs';
import { getAppEnv, getDatabaseUrl } from '../_shared/config.mjs';
import { stopChildProcess } from '../_shared/process.mjs';
import { buildSupabasePublicEnv, ensureSupabaseStarted, stopSupabase } from '../_shared/supabase.mjs';
import { startViteDevOnOpenPort } from '../_shared/vite.mjs';

const DATABASE_URL = getDatabaseUrl(process.env);
const APP_ENV = getAppEnv(process.env, 'test');

async function ensureE2EAuthSeedUser(env) {
	const supabaseUrl = env.E2E_SUPABASE_URL ?? env.PUBLIC_SUPABASE_URL;
	const serviceRoleKey = env.E2E_SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !serviceRoleKey || serviceRoleKey.trim().length === 0) {
		console.warn('[e2e] skipping auth seed user creation (missing supabase url or service role key)');
		return;
	}

	const email = 'davidmjadams+test@gmail.com';
	const password = 'password123';

	const admin = createClient(supabaseUrl, serviceRoleKey, {
		auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
	});

	const { error } = await admin.auth.admin.createUser({
		email,
		password,
		email_confirm: true
	});

	if (!error) {
		console.debug(`[e2e] seeded auth user ${email}`);
		return;
	}

	const msg = typeof error.message === 'string' ? error.message : String(error.message);
	const code = typeof error.code === 'string' ? error.code : '';
	if (code === 'email_exists' || /already|exists|registered/i.test(msg)) {
		console.debug(`[e2e] auth seed user already exists: ${email}`);
		return;
	}

	throw new Error(`[e2e] failed to seed auth user: ${msg}`);
}

async function main() {
	const feature = process.argv[2];
	if (!feature) {
		console.error('Usage: node scripts/e2e/run.mjs <feature-file>');
		process.exit(1);
	}

	const baseEnv = { ...process.env, DATABASE_URL, APP_ENV };

	// Ensure local Supabase is up (Docker/Colima required).
	await ensureSupabaseStarted(baseEnv);
	const { env: appEnv } = await buildSupabasePublicEnv({ baseEnv, includeE2E: true });

	// Full reset per feature file.
	await run('pnpm', ['db:supabase:reset'], { env: appEnv });

	// Recreate schema from Drizzle schema.
	await run('pnpm', ['db:push'], { env: appEnv });

	// Seed baseline data for the feature.
	await run('pnpm', ['db:seed:e2e'], { env: appEnv });

	// Seed an auth user we can reuse across scenarios.
	await ensureE2EAuthSeedUser(appEnv);

	// Start the app for this feature run.
	const { child: app, baseUrl } = await startViteDevOnOpenPort({
		env: appEnv,
		host: '127.0.0.1',
		startPort: 5173,
		maxTries: 20,
		waitPath: '/'
	});

	try {
		await run('pnpm', ['e2e:cucumber', feature], {
			env: {
				...appEnv,
				E2E_BASE_URL: baseUrl
			}
		});
	} finally {
		await stopChildProcess(app);
		await stopSupabase(appEnv).catch(() => {});
	}
}

await main();

