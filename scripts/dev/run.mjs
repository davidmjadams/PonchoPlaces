import process from 'node:process';

import { run } from '../_shared/exec.mjs';
import { getDatabaseUrl } from '../_shared/config.mjs';
import { buildSupabasePublicEnv, ensureSupabaseStarted } from '../_shared/supabase.mjs';
import { spawnViteDev } from '../_shared/vite.mjs';

const DATABASE_URL = getDatabaseUrl(process.env);

async function main() {
	const viteArgs = process.argv.slice(2);

	// Ensure local Supabase is running.
	const baseEnv = { ...process.env, DATABASE_URL };
	await ensureSupabaseStarted(baseEnv);

	// Ensure app has Supabase public env vars for SSR auth.
	const { env: appEnv } = await buildSupabasePublicEnv({ baseEnv });

	// Ensure schema exists in local DB.
	await run('pnpm', ['db:push'], { env: appEnv });

	// Seed some starter data (non-destructive).
	await run('pnpm', ['db:seed'], { env: appEnv });

	// Start dev server with DB configured.
	const dev = spawnViteDev({ env: appEnv, args: viteArgs });

	dev.on('exit', (code) => process.exit(code ?? 0));
}

await main();

