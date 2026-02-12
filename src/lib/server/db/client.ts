import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

import { env } from '$env/dynamic/private';

import * as schema from './schema.js';

const connectionString = env.DATABASE_URL;

if (!connectionString) {
	throw new Error('DATABASE_URL is not set. Please configure the environment variable.');
}

const sql = postgres(connectionString);

const createDrizzleClient = () => drizzle(sql, { schema });

type GlobalWithDb = typeof globalThis & {
	db?: ReturnType<typeof createDrizzleClient>;
};

export const db = (globalThis as GlobalWithDb).db ?? createDrizzleClient();

if (!(globalThis as GlobalWithDb).db) {
	(globalThis as GlobalWithDb).db = db;
}

export type DrizzleClient = typeof db;

export { schema };
