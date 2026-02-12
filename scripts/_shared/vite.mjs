import { spawn } from 'node:child_process';

import { findOpenPort, waitForHttpOk } from './net.mjs';

export function spawnViteDev({ env, args = [] } = {}) {
	return spawn('pnpm', ['exec', 'vite', 'dev', ...args], {
		stdio: 'inherit',
		env
	});
}

export async function startViteDevOnOpenPort({
	env,
	host = '127.0.0.1',
	startPort = 5173,
	maxTries = 20,
	waitPath = '/'
} = {}) {
	const port = await findOpenPort(host, startPort, maxTries);
	const baseUrl = `http://${host}:${port}`;

	const child = spawnViteDev({
		env,
		args: ['--host', host, '--port', String(port), '--strictPort']
	});

	if (waitPath) await waitForHttpOk(`${baseUrl}${waitPath}`);

	return { child, host, port, baseUrl };
}

