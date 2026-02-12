export async function stopChildProcess(child, { gracefulMs = 10_000, killMs = 5_000 } = {}) {
	if (child.killed) return;

	const waitForExit = (timeoutMs) =>
		new Promise((resolve) => {
			const t = setTimeout(() => resolve(false), timeoutMs);
			child.once('exit', () => {
				clearTimeout(t);
				resolve(true);
			});
		});

	child.kill('SIGTERM');
	const exited = await waitForExit(gracefulMs);
	if (exited) return;

	child.kill('SIGKILL');
	await waitForExit(killMs);
}

