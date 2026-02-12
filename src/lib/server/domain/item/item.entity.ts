import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const items = pgTable('items', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;

