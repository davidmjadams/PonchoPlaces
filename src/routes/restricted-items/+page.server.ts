import { redirect } from '@sveltejs/kit';
import { getDomainModule } from '$lib/server/infra/domainModule';
import type { RestrictedItemModule } from '$lib/server/domain/restricted-item/restricted-item.module';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals, url }) => {
	const { user } = await locals.safeGetSession();
	if (!user) {
		throw redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
	}

	const { restrictedItemService } = getDomainModule<RestrictedItemModule>('restricted-item');
	const rows = await restrictedItemService.listRestrictedItems();

	const restrictedItems = rows.map((row) => ({
		id: row.id,
		name: row.name,
		description: row.description ?? null
	}));

	return { restrictedItems };
}) satisfies PageServerLoad;

