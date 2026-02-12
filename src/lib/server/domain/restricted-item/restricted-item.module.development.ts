import type { RestrictedItemModule } from './restricted-item.module';
import { createRestrictedItemService } from './service/restricted-item.service';
import { createFileRestrictedItemStore } from './store/filesystem/restricted-item.store';

/**
 * Development domain module (wiring only).
 *
 * Uses filesystem-backed data so local development and unit tests do not require
 * a running Postgres instance.
 */
export default function restrictedItemModuleDevelopment(): RestrictedItemModule {
	const restrictedItemStore = createFileRestrictedItemStore({
		path: new URL('./seed/seed.json', import.meta.url).pathname
	});

	const restrictedItemService = createRestrictedItemService({ restrictedItemStore });

	return { restrictedItemStore, restrictedItemService };
}

