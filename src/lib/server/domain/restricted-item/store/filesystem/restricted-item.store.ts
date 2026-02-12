import { readFile } from 'node:fs/promises';

import type { NewRestrictedItem, RestrictedItem } from '../../restricted-item.entity';
import type { RestrictedItemStorePort } from '../restricted-item.store.port';

type FileRestrictedItem = Pick<RestrictedItem, 'id' | 'name' | 'description'> &
	Partial<Pick<RestrictedItem, 'createdAt'>>;

type SeedFixture = {
	restrictedItems?: FileRestrictedItem[];
};

export type FileRestrictedItemStoreOptions = {
	/**
	 * Path to a JSON file containing an array of restricted items.
	 *
	 * Example:
	 * [
	 *   { "id": 1, "name": "Example", "description": "..." }
	 * ]
	 */
	path: string;
};

/**
 * Adapter: filesystem-backed RestrictedItemStorePort.
 * Intended for development/demo environments.
 */
export const createFileRestrictedItemStore = ({
	path
}: FileRestrictedItemStoreOptions): RestrictedItemStorePort & {
	create: (newItem: NewRestrictedItem) => Promise<RestrictedItem>;
} => {
	const parseItems = (value: unknown): FileRestrictedItem[] => {
		// Back-compat: the file can be a raw array of items.
		if (Array.isArray(value)) return value as FileRestrictedItem[];
		// New: allow pointing at shared seed fixture JSON: { restrictedItems: [...] }
		if (value && typeof value === 'object' && !Array.isArray(value)) {
			const fixture = value as SeedFixture;
			if (fixture.restrictedItems && Array.isArray(fixture.restrictedItems)) return fixture.restrictedItems;
		}
		throw new Error(
			`Invalid JSON format for FileRestrictedItemStore. Expected an array or an object with "restrictedItems" array.`
		);
	};

	const load = async (): Promise<RestrictedItem[]> => {
		const raw = await readFile(path, 'utf8');
		const parsed = JSON.parse(raw) as unknown;
		const fileItems = parseItems(parsed);
		return fileItems.map((it) => ({
			id: it.id,
			name: it.name,
			description: it.description ?? null,
			createdAt: it.createdAt ? new Date(it.createdAt) : new Date(0)
		}));
	};

	return {
		findAll: async () => await load(),
		findById: async (id) => {
			const all = await load();
			return all.find((it) => it.id === id);
		},
		create: async (newItem) => ({
			id: 0,
			name: newItem.name,
			description: newItem.description ?? null,
			createdAt: new Date()
		})
	};
};

