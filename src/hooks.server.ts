import { env } from '$env/dynamic/public';
import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit';

function isInvalidRefreshTokenError(error: unknown): boolean {
	if (!error || typeof error !== 'object') return false;
	const anyErr = error as { code?: unknown; message?: unknown; status?: unknown };
	const code = typeof anyErr.code === 'string' ? anyErr.code : '';
	const message = typeof anyErr.message === 'string' ? anyErr.message : '';
	const status = typeof anyErr.status === 'number' ? anyErr.status : undefined;

	// Common Supabase Auth error when a stale refresh token cookie exists (often after resets).
	if (code === 'refresh_token_not_found' || code === 'invalid_refresh_token') return true;
	if (status === 400 && /invalid refresh token/i.test(message)) return true;
	if (/refresh token not found/i.test(message)) return true;
	return false;
}

function clearSupabaseAuthCookies(event: Parameters<Handle>[0]['event']) {
	for (const { name } of event.cookies.getAll()) {
		// Supabase SSR cookies typically use `sb-*`. Be conservative but effective.
		if (name.startsWith('sb-') || name.includes('supabase')) {
			event.cookies.delete(name, { path: '/' });
		}
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	const supabaseUrl = env.PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseAnonKey) {
		throw new Error('Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY');
	}

	event.locals.supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				for (const { name, value, options } of cookiesToSet) {
					event.cookies.set(name, value, { path: '/', ...options });
				}
			}
		}
	});

	event.locals.safeGetSession = async () => {
		const {
			data: { session },
			error
		} = await event.locals.supabase.auth.getSession();

		if (error) {
			if (isInvalidRefreshTokenError(error)) clearSupabaseAuthCookies(event);
			return { session: null, user: null };
		}
		if (!session) return { session: null, user: null };

		// IMPORTANT: Don't trust `session.user` from cookies/storage directly.
		// Validate the user with the Supabase Auth server.
		const {
			data: { user },
			error: userError
		} = await event.locals.supabase.auth.getUser();

		if (userError) {
			if (isInvalidRefreshTokenError(userError)) clearSupabaseAuthCookies(event);
			return { session: null, user: null };
		}
		if (!user) return { session: null, user: null };
		return { session, user };
	};

	// IMPORTANT: This ensures Supabase can set/refresh auth cookies during SSR.
	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

