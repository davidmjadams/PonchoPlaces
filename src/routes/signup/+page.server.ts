import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	// Already logged in: you don't need to sign up again.
	if (user) throw redirect(303, '/restricted-items');
	return {};
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const form = await request.formData();
		const email = form.get('email');
		const password = form.get('password');

		if (typeof email !== 'string' || email.trim().length === 0) {
			return fail(400, { error: 'Email is required.' });
		}
		if (typeof password !== 'string' || password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters.' });
		}

		const { error } = await locals.supabase.auth.signUp({
			email: email.trim(),
			password
		});

		if (error) return fail(400, { error: error.message });

		// In local/dev (and our e2e), email confirmation is disabled, so this should also
		// establish a session cookie and count as "logged in".
		throw redirect(303, '/account-created');
	}
};

