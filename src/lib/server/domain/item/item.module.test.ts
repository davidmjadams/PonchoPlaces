import { createItemService } from './service/item.service';
import type { ItemModule } from './item.module';
import { createDbItemStore } from './store/db/item.store';

/**
 * Test domain module (wiring only).
 * Keep DB-backed behavior as the default for APP_ENV=test.
 */
export default function itemModuleTest(): ItemModule {
	const itemStore = createDbItemStore();
	const itemService = createItemService({ itemStore });

	return { itemStore, itemService };
}

