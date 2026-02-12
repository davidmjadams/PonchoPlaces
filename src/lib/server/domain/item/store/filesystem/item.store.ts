import { readFile } from 'node:fs/promises';

import type { Item, NewItem } from '../../item.entity';
import type { ItemStorePort } from '../item.store.port';

type FileItem = Pick<Item, 'id' | 'name' | 'description'> & Partial<Pick<Item, 'createdAt'>>;

type SeedFixture = {
	items?: FileItem[];
};

export type FileItemStoreOptions = {
	/**
	 * Path to a JSON file containing an array of items.
	 *
	 * Example:
	 * [
	 *   { "id": 1, "name": "Example", "description": "..." }
	 * ]
	 */
	path: string;
};

/**
 * Adapter: filesystem-backed ItemStorePort.
 * Intended for development/demo environments.
 */
export const createFileItemStore = ({ path }: FileItemStoreOptions): ItemStorePort & {
	create: (newItem: NewItem) => Promise<Item>;
} => {
	const parseItems = (value: unknown): FileItem[] => {
		// Back-compat: the file can be a raw array of items.
		if (Array.isArray(value)) return value as FileItem[];
		// New: allow pointing at shared seed fixture JSON: { items: [...] }
		if (value && typeof value === 'object' && !Array.isArray(value)) {
			const fixture = value as SeedFixture;
			if (fixture.items && Array.isArray(fixture.items)) return fixture.items;
		}
		throw new Error(
			`Invalid JSON format for FileItemStore. Expected an array or an object with "items" array.`
		);
	};

	const load = async (): Promise<Item[]> => {
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
		create: async (newItem) => {
			// Minimal implementation for parity; real implementation would persist.
			return {
				id: 0,
				name: newItem.name,
				description: newItem.description ?? null,
				createdAt: new Date()
			};
		}
	};
};

