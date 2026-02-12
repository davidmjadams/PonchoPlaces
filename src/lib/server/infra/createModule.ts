/**
 * Canonical app environments.
 *
 * We accept several aliases (e.g. `dev` -> `development`, `prod` -> `production`)
 * to interop with tooling/scripts while keeping module naming consistent.
 */
export type AppEnv = 'development' | 'test' | 'stage' | 'production' | 'e2e_fs';

export type ModuleFactories<T> = {
	default: () => T;
	// Canonical keys
	development?: () => T;
	test?: () => T;
	stage?: () => T;
	production?: () => T;
	e2e_fs?: () => T;

	// Back-compat keys
	dev?: () => T;
	prod?: () => T;
};

function normalizeAppEnv(env?: string): AppEnv | undefined {
	if (!env) return undefined;
	if (env === 'development' || env === 'test' || env === 'stage' || env === 'production' || env === 'e2e_fs') {
		return env;
	}
	if (env === 'dev') return 'development';
	if (env === 'prod') return 'production';
	if (env === 'staging') return 'stage';
	return undefined;
}

/**
 * Environment-aware module selection (decision logic lives in infra).
 */
export function createModule<T>(
	factories: ModuleFactories<T>,
	env = process.env.APP_ENV ?? process.env.NODE_ENV ?? 'dev'
): T {
	const environment = normalizeAppEnv(env);
	if (!environment) return factories.default();

	if (environment === 'development') return (factories.development ?? factories.dev ?? factories.default)();
	if (environment === 'test') return (factories.test ?? factories.default)();
	if (environment === 'stage') return (factories.stage ?? factories.default)();
	if (environment === 'production') return (factories.production ?? factories.prod ?? factories.default)();
	if (environment === 'e2e_fs') return (factories.e2e_fs ?? factories.default)();
	return factories.default();
}

