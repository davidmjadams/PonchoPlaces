import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Application profile data for a Supabase Auth user.
 *
 * `id` is the Supabase auth user id (uuid). A row is auto-created on signup via
 * a DB trigger (see `supabase/migrations/*_create_profiles.sql`).
 */
export const profiles = pgTable('profiles', {
	id: uuid('id').primaryKey(),
	name: text('name'),
	description: text('description'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

