import type { ItemServicePort } from './item.service.port';
import type { ItemStorePort } from '../store/item.store.port';

export const createItemService = (deps: { itemStore: ItemStorePort }): ItemServicePort => ({
	listItems: () => deps.itemStore.findAll()
});

export type ItemService = ReturnType<typeof createItemService>;

