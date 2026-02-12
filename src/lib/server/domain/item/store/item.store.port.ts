import type { Item } from '../item.entity';

export type ItemStorePort = {
	findAll: () => Promise<Item[]>;
	findById: (id: Item['id']) => Promise<Item | undefined>;
};

