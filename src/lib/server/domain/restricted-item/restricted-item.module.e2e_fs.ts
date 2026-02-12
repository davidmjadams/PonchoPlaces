import { createRestrictedItemService } from './service/restricted-item.service';
import type { RestrictedItemModule } from './restricted-item.module';
import { createFileRestrictedItemStore } from './store/filesystem/restricted-item.store';

/**
 * E2E filesystem-backed domain module (wiring only).
 * Enable with APP_ENV=e2e_fs.
 */
export default function restrictedItemModuleE2eFs(): RestrictedItemModule {
	const restrictedItemStore = createFileRestrictedItemStore({
		path: new URL('./seed/seed.e2e_fs.json', import.meta.url).pathname
	});
	const restrictedItemService = createRestrictedItemService({ restrictedItemStore });

	return { restrictedItemStore, restrictedItemService };
}

