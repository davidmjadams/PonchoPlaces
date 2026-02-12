import { createServer } from 'node:net';

export async function waitForHttpOk(url, timeoutMs = 60_000) {
	const started = Date.now();
	// eslint-disable-next-line no-constant-condition
	while (true) {
		try {
			const res = await fetch(url, { redirect: 'manual' });
			if (res.status >= 200 && res.status < 500) return;
		} catch {
			// ignore
		}

		if (Date.now() - started > timeoutMs) {
			throw new Error(`Timed out waiting for ${url}`);
		}
		await new Promise((r) => setTimeout(r, 250));
	}
}

export async function findOpenPort(host, startPort, maxTries = 20) {
	for (let port = startPort; port < startPort + maxTries; port++) {
		// eslint-disable-next-line no-await-in-loop
		const ok = await new Promise((resolve) => {
			const server = createServer();
			server.once('error', () => resolve(false));
			server.listen(port, host, () => {
				server.close(() => resolve(true));
			});
		});
		if (ok) return port;
	}
	throw new Error(`Could not find open port in range ${startPort}-${startPort + maxTries - 1}`);
}

