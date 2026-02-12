import { spawn } from 'node:child_process';

export function run(cmd, args, opts = {}) {
	return new Promise((resolve, reject) => {
		const child = spawn(cmd, args, { stdio: 'inherit', ...opts });
		child.on('exit', (code) => {
			if (code === 0) resolve();
			else reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`));
		});
	});
}

export function runCapture(cmd, args, opts = {}) {
	return new Promise((resolve, reject) => {
		const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...opts });
		let out = '';
		let err = '';
		child.stdout.on('data', (d) => (out += String(d)));
		child.stderr.on('data', (d) => (err += String(d)));
		child.on('exit', (code) => {
			if (code === 0) resolve({ stdout: out, stderr: err });
			else reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}\n${err}`));
		});
	});
}

