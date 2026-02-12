import { getDomainModule } from '$lib/server/infra/domainModule';
import type { ItemModule } from '$lib/server/domain/item/item.module';
import type { PageServerLoad } from './$types';

export const load = (async () => {
	const { itemService } = getDomainModule<ItemModule>('item');
	const rows = await itemService.listItems();

	const items = rows.map((row) => ({
		id: row.id,
		name: row.name,
		description: row.description ?? null
	}));

	return { items };
}) satisfies PageServerLoad;

