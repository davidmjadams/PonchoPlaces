import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const restrictedItems = pgTable('restricted_items', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export type RestrictedItem = typeof restrictedItems.$inferSelect;
export type NewRestrictedItem = typeof restrictedItems.$inferInsert;

