import { describe, expect, it } from 'vitest';

import { createModule } from './createModule';

describe('createModule', () => {
	it('selects environment-specific factories when available', () => {
		const factories = {
			default: () => 'default',
			development: () => 'development',
			test: () => 'test',
			production: () => 'production'
		};

		expect(createModule(factories, 'development')).toBe('development');
		expect(createModule(factories, 'test')).toBe('test');
		expect(createModule(factories, 'production')).toBe('production');
	});

	it('falls back to default factory when no override exists', () => {
		const factories = {
			default: () => 'default'
		};

		expect(createModule(factories, 'development')).toBe('default');
		expect(createModule(factories, 'unknown')).toBe('default');
		expect(createModule(factories, undefined)).toBe('default');
	});
});
