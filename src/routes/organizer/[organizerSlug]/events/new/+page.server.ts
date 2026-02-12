import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	return {
		organizerSlug: params.organizerSlug
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async ({ params, request }) => {
		const form = await request.formData();
		const title = form.get('title');
		if (typeof title !== 'string' || title.trim().length === 0) {
			return fail(400, { error: 'Event title is required.' });
		}

		// TODO(v1-organizer): Persist event + ticket type creation in domain service/store.
		throw redirect(303, `/organizer/${params.organizerSlug}/dashboard`);
	}
};
