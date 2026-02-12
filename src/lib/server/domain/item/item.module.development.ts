import type { ItemModule } from './item.module';
import { createItemService as createItemServiceDevelopment } from './service/item.service.development';
import { createFileItemStore } from './store/filesystem/item.store';

/**
 * Development domain module (wiring only).
 *
 * Uses filesystem-backed data so local development and unit tests do not require
 * a running Postgres instance.
 */
export default function itemModuleDevelopment(): ItemModule {
	const itemStore = createFileItemStore({
		path: new URL('./seed/seed.json', import.meta.url).pathname
	});

	const itemService = createItemServiceDevelopment({ itemStore });

	return { itemStore, itemService };
}

