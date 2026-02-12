import type { RestrictedItem } from '../restricted-item.entity';

export type RestrictedItemServicePort = {
	listRestrictedItems: () => Promise<RestrictedItem[]>;
};

