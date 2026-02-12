import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

type ProfileRow = {
	id: string;
	name: string | null;
	description: string | null;
};

export const load = (async ({ locals, url }) => {
	const { user } = await locals.safeGetSession();
	if (!user) {
		throw redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
	}

	const { data, error } = await locals.supabase
		.from('profiles')
		.select('id,name,description')
		.eq('id', user.id)
		.maybeSingle<ProfileRow>();

	if (error) {
		throw new Error(error.message);
	}

	return {
		profile: data ?? { id: user.id, name: null, description: null }
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	save: async ({ locals, request }) => {
		const { user } = await locals.safeGetSession();
		if (!user) throw redirect(303, '/login');

		const form = await request.formData();
		const name = form.get('name');
		const description = form.get('description');

		if (name !== null && typeof name !== 'string') return fail(400, { error: 'Invalid name.' });
		if (description !== null && typeof description !== 'string') {
			return fail(400, { error: 'Invalid description.' });
		}

		const normalizedName = name?.trim() ? name.trim() : null;
		const normalizedDescription = description?.trim() ? description.trim() : null;

		const { error } = await locals.supabase.from('profiles').upsert(
			{
				id: user.id,
				name: normalizedName,
				description: normalizedDescription
			},
			{ onConflict: 'id' }
		);

		if (error) return fail(400, { error: error.message });

		return { success: true };
	}
};

