import { desc } from 'drizzle-orm';

import { db } from '$lib/server/db/client.js';
import type { DrizzleClient } from '$lib/server/db/client.js';

import { restrictedItems } from '../../restricted-item.entity.js';
import type { NewRestrictedItem, RestrictedItem } from '../../restricted-item.entity.js';
import type { RestrictedItemStorePort } from '../restricted-item.store.port';

/**
 * Adapter: PostgreSQL (Drizzle) implementation of the RestrictedItemStorePort.
 */
export const createDbRestrictedItemStore = (database: DrizzleClient = db) =>
	({
		findAll: async () =>
			await database.select().from(restrictedItems).orderBy(desc(restrictedItems.createdAt)),
		create: async (newItem: NewRestrictedItem) => {
			const [created] = await database.insert(restrictedItems).values(newItem).returning();
			if (!created) {
				throw new Error(`Failed to create restricted item with data: ${JSON.stringify(newItem)}`);
			}
			return created;
		},
		findById: async (id: RestrictedItem['id']) =>
			await database.query.restrictedItems.findFirst({
				where: (fields, operators) => operators.eq(fields.id, id)
			})
	}) satisfies RestrictedItemStorePort & {
		/**
		 * Persistence-only helper (not part of RestrictedItemStorePort).
		 */
		create: (newItem: NewRestrictedItem) => Promise<RestrictedItem>;
	};

export type DbRestrictedItemStore = ReturnType<typeof createDbRestrictedItemStore>;

