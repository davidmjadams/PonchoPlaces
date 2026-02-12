import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load = (async ({ locals, url }) => {
	const { user } = await locals.safeGetSession();
	// Already logged in: bounce to requested page.
	if (user) {
		const redirectTo = url.searchParams.get('redirectTo') ?? '/restricted-items';
		throw redirect(303, redirectTo);
	}
	return {};
}) satisfies PageServerLoad;

export const actions: Actions = {
	login: async ({ locals, request, url }) => {
		const form = await request.formData();
		const email = form.get('email');
		const password = form.get('password');

		if (typeof email !== 'string' || email.trim().length === 0) {
			return fail(400, { error: 'Email is required.' });
		}
		if (typeof password !== 'string' || password.length === 0) {
			return fail(400, { error: 'Password is required.' });
		}

		const { error } = await locals.supabase.auth.signInWithPassword({
			email: email.trim(),
			password
		});

		if (error) {
			// Avoid leaking unnecessary details; keep it user friendly.
			return fail(400, { error: error.message });
		}

		const redirectTo = url.searchParams.get('redirectTo') ?? '/restricted-items';
		throw redirect(303, redirectTo);
	},
	signup: async ({ locals, request, url }) => {
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

		if (error) {
			return fail(400, { error: error.message });
		}

		// If email confirmation is enabled, user won't be logged in yet.
		// For local/dev templates, this often auto-confirms; either way, send them forward.
		const redirectTo = url.searchParams.get('redirectTo') ?? '/restricted-items';
		throw redirect(303, redirectTo);
	}
};

