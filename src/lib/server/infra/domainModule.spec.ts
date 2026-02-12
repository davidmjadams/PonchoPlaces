import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ItemModule } from '../domain/item/item.module';

vi.mock('$env/dynamic/private', () => ({
	env: {
		DATABASE_URL: 'postgres://vitest:vitest@localhost:5432/vitest'
	}
}));

const { getDomainModule } = await import('./domainModule');

describe('getDomainModule', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('loads the development module when environment is development', async () => {
		const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);
		const module = getDomainModule<ItemModule>('item', 'development');

		const items = await module.itemService.listItems();

		expect(items.length).toBeGreaterThan(0);
		expect(debugSpy).toHaveBeenCalled();
	});

	it('normalizes dev environment alias to development', async () => {
		const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);
		const module = getDomainModule<ItemModule>('item', 'dev');

		await module.itemService.listItems();

		expect(debugSpy).toHaveBeenCalled();
	});

	it('throws when the domain module cannot be found', () => {
		expect(() => getDomainModule('missing-domain', 'development')).toThrow(
			'Looked for ../domain/missing-domain/missing-domain.module.development.ts'
		);
	});
});
