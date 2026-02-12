import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';

import { items, restrictedItems } from '../schema.js';
import * as schema from '../schema.js';
import type { SeedData } from './seed-data.js';

type SeedEnv = 'dev' | 'test' | 'stage' | 'prod' | 'e2e_fs';

export type SeedOptions = {
	databaseUrl: string;
	mode: SeedEnv;
	data: SeedData;
	/**
	 * If true, clears tables before inserting.
	 * Intended for e2e runs.
	 */
	reset?: boolean;
};

async function truncateForSeed(db: ReturnType<typeof drizzle>) {
	// Order doesn't matter with CASCADE, but keep it explicit.
	await db.execute(sql.raw('truncate table "items" restart identity cascade'));
	await db.execute(sql.raw('truncate table "restricted_items" restart identity cascade'));
}

export async function seedDatabase({ databaseUrl, mode, data, reset = false }: SeedOptions) {
	const sqlClient = postgres(databaseUrl, { max: 1 });
	const db = drizzle(sqlClient, { schema });

	try {
		if (reset) {
			await truncateForSeed(db);
		}

		// In dev we default to non-destructive seeds.
		// In e2e we usually run with reset=true, but keep inserts deterministic anyway.
		//
		// Important: Our shared fixtures may include explicit `id` values so filesystem-backed
		// adapters can be deterministic. We MUST NOT insert explicit ids into serial columns
		// or Postgres sequences can get out of sync (leading to duplicate key errors later).
		const itemValues = (data.items ?? []).map(({ id: _id, createdAt: _createdAt, ...rest }) => rest);
		const restrictedItemValues = (data.restrictedItems ?? []).map(
			({ id: _id, createdAt: _createdAt, ...rest }) => rest
		);

		if (mode === 'dev' && !reset) {
			if (itemValues.length) {
				const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(items);
				if (count === 0) await db.insert(items).values(itemValues);
			}
			if (restrictedItemValues.length) {
				const [{ count }] = await db
					.select({ count: sql<number>`count(*)::int` })
					.from(restrictedItems);
				if (count === 0) await db.insert(restrictedItems).values(restrictedItemValues);
			}
			return;
		}

		// For reset mode (or non-dev), just insert.
		if (itemValues.length) await db.insert(items).values(itemValues);
		if (restrictedItemValues.length) await db.insert(restrictedItems).values(restrictedItemValues);
	} finally {
		await sqlClient.end({ timeout: 5 });
	}
}

