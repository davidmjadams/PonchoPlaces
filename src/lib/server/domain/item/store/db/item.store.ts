import { desc } from 'drizzle-orm';

import { db } from '$lib/server/db/client.js';
import type { DrizzleClient } from '$lib/server/db/client.js';

import { items } from '../../item.entity.js';
import type { Item, NewItem } from '../../item.entity.js';
import type { ItemStorePort } from '../item.store.port';

/**
 * Adapter: PostgreSQL (Drizzle) implementation of the ItemStorePort.
 */
export const createDbItemStore = (database: DrizzleClient = db) =>
	({
		findAll: async () => await database.select().from(items).orderBy(desc(items.createdAt)),
		create: async (newItem: NewItem) => {
			const [created] = await database.insert(items).values(newItem).returning();
			if (!created) {
				throw new Error(`Failed to create item with data: ${JSON.stringify(newItem)}`);
			}
			return created;
		},
		findById: async (id: Item['id']) =>
			await database.query.items.findFirst({
				where: (fields, operators) => operators.eq(fields.id, id)
			})
	}) satisfies ItemStorePort & {
		/**
		 * Persistence-only helper (not part of ItemStorePort).
		 * Keep domain services depending on ports, not this method.
		 */
		create: (newItem: NewItem) => Promise<Item>;
	};

export type DbItemStore = ReturnType<typeof createDbItemStore>;

