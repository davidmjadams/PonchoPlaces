import { run, runCapture } from './exec.mjs';

export const DEFAULT_SUPABASE_LOCAL_URL = 'http://127.0.0.1:54321';

export async function ensureSupabaseStarted(env) {
	await run('pnpm', ['db:supabase:start'], { env });
}

export async function stopSupabase(env) {
	await run('pnpm', ['db:supabase:stop'], { env });
}

export async function getLocalSupabaseStatus(env) {
	// `supabase status --output json` prints some human text before the JSON.
	const { stdout } = await runCapture('pnpm', ['exec', 'supabase', 'status', '--output', 'json'], {
		env
	});
	const idx = stdout.indexOf('{');
	if (idx < 0) throw new Error('Failed to parse supabase status JSON (no JSON found)');
	const parsed = JSON.parse(stdout.slice(idx));
	if (!parsed || typeof parsed !== 'object') {
		throw new Error('Failed to parse supabase status JSON');
	}
	return parsed;
}

/**
 * Build the public Supabase env vars required by our SvelteKit SSR auth hook.
 * - Uses existing `PUBLIC_SUPABASE_*` if present, otherwise derives from `supabase status`.
 * - When `includeE2E` is true, includes `E2E_SUPABASE_URL` and `E2E_SUPABASE_SERVICE_ROLE_KEY`.
 */
export async function buildSupabasePublicEnv({
	baseEnv,
	supabaseUrl = baseEnv.PUBLIC_SUPABASE_URL ?? DEFAULT_SUPABASE_LOCAL_URL,
	includeE2E = false
}) {
	const status = await getLocalSupabaseStatus(baseEnv);

	const anonKey =
		baseEnv.PUBLIC_SUPABASE_ANON_KEY ??
		(typeof status.ANON_KEY === 'string' ? status.ANON_KEY : undefined);

	if (!anonKey) {
		throw new Error('Could not determine Supabase ANON_KEY (set PUBLIC_SUPABASE_ANON_KEY)');
	}

	const env = {
		...baseEnv,
		PUBLIC_SUPABASE_URL: supabaseUrl,
		PUBLIC_SUPABASE_ANON_KEY: anonKey
	};

	if (!includeE2E) return { env, status };

	const serviceRoleKey =
		typeof status.SERVICE_ROLE_KEY === 'string' ? status.SERVICE_ROLE_KEY : undefined;

	return {
		env: {
			...env,
			E2E_SUPABASE_URL: supabaseUrl,
			E2E_SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey ?? ''
		},
		status
	};
}

