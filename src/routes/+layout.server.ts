import type { LayoutServerLoad } from './$types';

export const load = (async ({ locals }) => {
	const { user } = await locals.safeGetSession();

	return {
		user: user
			? {
					id: user.id,
					email: user.email ?? null
				}
			: null
	};
}) satisfies LayoutServerLoad;

