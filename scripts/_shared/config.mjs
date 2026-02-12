export const DEFAULT_DATABASE_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

export function getDatabaseUrl(env = process.env) {
	return env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
}

export function getAppEnv(env = process.env, fallback = 'test') {
	return env.APP_ENV ?? fallback;
}

