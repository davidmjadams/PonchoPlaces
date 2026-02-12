/**
 * Drizzle schema entrypoint.
 *
 * Keep this file as the single schema import for Drizzle tooling, but organise
 * tables/types by domain under `src/lib/server/domain/<domain>/*.entity.ts`.
 */

export * from '../domain/user/profile.entity';
export * from '../domain/item/item.entity';
export * from '../domain/restricted-item/restricted-item.entity';
