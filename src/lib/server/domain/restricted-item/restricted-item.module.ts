import { createRestrictedItemService } from './service/restricted-item.service';
import type { RestrictedItemServicePort } from './service/restricted-item.service.port';
import type { RestrictedItemStorePort } from './store/restricted-item.store.port';
import { createDbRestrictedItemStore } from './store/db/restricted-item.store';

/**
 * Domain module (wiring only).
 */
export type RestrictedItemModule = {
	restrictedItemStore: RestrictedItemStorePort;
	restrictedItemService: RestrictedItemServicePort;
};

export default function restrictedItemModule(): RestrictedItemModule {
	const restrictedItemStore = createDbRestrictedItemStore();
	const restrictedItemService = createRestrictedItemService({ restrictedItemStore });

	return { restrictedItemStore, restrictedItemService };
}

