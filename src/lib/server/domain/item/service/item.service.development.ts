import type { ItemServicePort } from './item.service.port';
import type { ItemStorePort } from '../store/item.store.port';

/**
 * Development service implementation (example).
 * Shows how a module can swap entire service implementations per environment.
 */
export const createItemService = (deps: { itemStore: ItemStorePort }): ItemServicePort => ({
	listItems: async () => {
		const started = Date.now();
		const rows = await deps.itemStore.findAll();
		console.debug(`[item.development] listItems -> ${rows.length} rows (${Date.now() - started}ms)`);
		return rows;
	}
});

