import type { RestrictedItemServicePort } from './restricted-item.service.port';
import type { RestrictedItemStorePort } from '../store/restricted-item.store.port';

export const createRestrictedItemService = (deps: {
	restrictedItemStore: RestrictedItemStorePort;
}): RestrictedItemServicePort => ({
	listRestrictedItems: () => deps.restrictedItemStore.findAll()
});

export type RestrictedItemService = ReturnType<typeof createRestrictedItemService>;

