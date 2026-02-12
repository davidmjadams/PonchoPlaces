import type { Item } from '../item.entity';

export type ItemServicePort = {
	listItems: () => Promise<Item[]>;
};

