import 'dotenv/config';

import { seedDatabase } from './seed.js';
import { assertSeedEnv, loadSeedData } from './seed-data.js';
import type { SeedEnv } from './seed-data.js';

function parseArgs(argv: string[]) {
	const args = new Set(argv);
	const modeRaw =
		(argv.includes('--mode') ? (argv[argv.indexOf('--mode') + 1] as string | undefined) : undefined) ??
		process.env.APP_ENV ??
		process.env.NODE_ENV ??
		'dev';
	assertSeedEnv(modeRaw);
	const mode = modeRaw satisfies SeedEnv;
	const reset = args.has('--reset');

	return { mode, reset };
}

async function main() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error('DATABASE_URL is required for seeding');
	}

	const { mode, reset } = parseArgs(process.argv.slice(2));
	const data = await loadSeedData(mode);

	await seedDatabase({
		databaseUrl,
		mode,
		reset,
		data
	});
}

await main();

