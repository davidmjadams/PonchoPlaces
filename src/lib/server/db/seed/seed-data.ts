import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

import type { NewItem } from '../schema.js';
import type { NewRestrictedItem } from '../schema.js';

export type SeedData = {
	items?: NewItem[];
	restrictedItems?: NewRestrictedItem[];
};

export type SeedEnv = 'dev' | 'test' | 'stage' | 'prod' | 'e2e_fs';

export function assertSeedEnv(env: string | undefined): asserts env is SeedEnv {
	if (env === 'dev' || env === 'test' || env === 'stage' || env === 'prod' || env === 'e2e_fs') return;
	throw new Error(
		`Invalid seed mode "${String(env)}". Expected one of: dev, test, stage, prod, e2e_fs.`
	);
}

function emptySeed(): SeedData {
	return { items: [], restrictedItems: [] };
}

function mergeSeeds(acc: SeedData, next: SeedData): SeedData {
	return {
		items: [...(acc.items ?? []), ...(next.items ?? [])],
		restrictedItems: [...(acc.restrictedItems ?? []), ...(next.restrictedItems ?? [])]
	};
}

function applyDomainOverride(base: SeedData, override?: SeedData): SeedData {
	if (!override) return base;
	return {
		items: override.items ?? base.items,
		restrictedItems: override.restrictedItems ?? base.restrictedItems
	};
}

function assertSeedData(value: unknown, label: string): asserts value is SeedData {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error(`${label} must be an object`);
	}
	const v = value as Record<string, unknown>;
	if ('items' in v && v.items !== undefined && !Array.isArray(v.items)) {
		throw new Error(`${label}.items must be an array when present`);
	}
	if ('restrictedItems' in v && v.restrictedItems !== undefined && !Array.isArray(v.restrictedItems)) {
		throw new Error(`${label}.restrictedItems must be an array when present`);
	}
}

/**
 * Load seed fixtures by scanning domains.
 *
 * Convention per domain:
 * - `src/lib/server/domain/<domain>/seed/seed.json` (base)
 * - `src/lib/server/domain/<domain>/seed/seed.<env>.json` (override)
 */
export async function loadSeedData(env: SeedEnv): Promise<SeedData> {
	const domainDir = new URL('../../domain/', import.meta.url);
	const domainPath = domainDir.pathname;

	const entries = await readdir(domainPath, { withFileTypes: true });
	const domains = entries.filter((e) => e.isDirectory()).map((e) => e.name);

	let acc = emptySeed();

	for (const domain of domains) {
		const seedFolder = join(domainPath, domain, 'seed');
		const basePath = join(seedFolder, 'seed.json');
		const envPath = join(seedFolder, `seed.${env}.json`);

		let base: SeedData | undefined;
		let override: SeedData | undefined;

		try {
			const raw = await readFile(basePath, 'utf8');
			const parsed = JSON.parse(raw) as unknown;
			assertSeedData(parsed, `Seed fixture (${basePath})`);
			base = parsed;
		} catch {
			// No base seed for this domain; skip.
			continue;
		}

		try {
			const raw = await readFile(envPath, 'utf8');
			const parsed = JSON.parse(raw) as unknown;
			assertSeedData(parsed, `Seed fixture (${envPath})`);
			override = parsed;
		} catch {
			// No env override for this domain; ok.
		}

		acc = mergeSeeds(acc, applyDomainOverride(base, override));
	}

	return acc;
}

