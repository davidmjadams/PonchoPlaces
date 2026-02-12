import { createRestrictedItemService } from './service/restricted-item.service';
import type { RestrictedItemModule } from './restricted-item.module';
import { createDbRestrictedItemStore } from './store/db/restricted-item.store';

/**
 * Test domain module (wiring only).
 * Keep DB-backed behavior as the default for APP_ENV=test.
 */
export default function restrictedItemModuleTest(): RestrictedItemModule {
	const restrictedItemStore = createDbRestrictedItemStore();
	const restrictedItemService = createRestrictedItemService({ restrictedItemStore });

	return { restrictedItemStore, restrictedItemService };
}

