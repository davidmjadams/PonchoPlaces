type ModuleFactory<T> = () => T;

type GlobModule = { default?: unknown };

// Eagerly load all domain module variants so we can select at runtime.
// Keys are relative to this file (e.g. "../domain/item/item.module.ts").
const domainModules = import.meta.glob<GlobModule>('../domain/**/**/*.module*.ts', {
	eager: true
});

function asFactory<T>(m: GlobModule): ModuleFactory<T> {
	if (!m.default || typeof m.default !== 'function') {
		throw new Error('Domain module must default-export a factory function.');
	}
	return m.default as ModuleFactory<T>;
}

function assertPlainObject(value: unknown, label: string): asserts value is Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error(`${label} must return an object`);
	}
}

export type AppEnv = 'dev' | 'test' | 'stage' | 'prod' | 'e2e_fs';

/**
 * Load a domain module by convention:
 * - `../domain/<domain>/<domain>.module.<env>.ts` if present
 * - otherwise `../domain/<domain>/<domain>.module.ts`
 */
export function getDomainModule<T>(
	domain: string,
	env = process.env.APP_ENV ?? process.env.NODE_ENV ?? 'dev'
): T {
	const normalize = (value?: string): 'development' | 'test' | 'stage' | 'production' | 'e2e_fs' => {
		if (!value) return 'development';
		if (value === 'development' || value === 'test' || value === 'stage' || value === 'production' || value === 'e2e_fs') {
			return value;
		}
		if (value === 'dev') return 'development';
		if (value === 'prod') return 'production';
		if (value === 'staging') return 'stage';
		// Keep vitest + node default values stable.
		if (value === 'production') return 'production';
		if (value === 'test') return 'test';
		if (value === 'development') return 'development';
		return 'development';
	};

	const environment = normalize(env);

	const envKey = `../domain/${domain}/${domain}.module.${environment}.ts`;
	const baseKey = `../domain/${domain}/${domain}.module.ts`;

	const baseModule = domainModules[baseKey];
	if (!baseModule) {
		throw new Error(
			`Domain module not found for "${domain}". Looked for ${envKey}`
		);
	}

	const baseValue = asFactory<T>(baseModule)();
	assertPlainObject(baseValue, `Base module (${baseKey})`);

	const envModule = domainModules[envKey];
	if (!envModule) return baseValue;

	// Env modules should swap complete implementations (adapter/service), not patch objects.
	const envValue = asFactory<T>(envModule)();
	assertPlainObject(envValue, `Env module (${envKey})`);
	return envValue;
}

