import type { RestrictedItem } from '../restricted-item.entity';

export type RestrictedItemStorePort = {
	findAll: () => Promise<RestrictedItem[]>;
	findById: (id: RestrictedItem['id']) => Promise<RestrictedItem | undefined>;
};

