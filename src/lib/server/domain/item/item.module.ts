import { createItemService } from './service/item.service';
import type { ItemServicePort } from './service/item.service.port';
import type { ItemStorePort } from './store/item.store.port';
import { createDbItemStore } from './store/db/item.store';

/**
 * Domain module (wiring only).
 */
export type ItemModule = {
	itemStore: ItemStorePort;
	itemService: ItemServicePort;
};

export default function itemModule(): ItemModule {
	const itemStore = createDbItemStore();
	const itemService = createItemService({ itemStore });

	return { itemStore, itemService };
}

