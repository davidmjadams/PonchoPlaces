import { createItemService } from './service/item.service';
import type { ItemModule } from './item.module';
import { createFileItemStore } from './store/filesystem/item.store';

/**
 * E2E filesystem-backed domain module (wiring only).
 * Enable with APP_ENV=e2e_fs.
 */
export default function itemModuleE2eFs(): ItemModule {
	const itemStore = createFileItemStore({
		path: new URL('./seed/seed.e2e_fs.json', import.meta.url).pathname
	});
	const itemService = createItemService({ itemStore });

	return { itemStore, itemService };
}

