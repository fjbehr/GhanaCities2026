import { spawn } from 'node:child_process';
import { tools } from './env.ts';
import { pgEnv } from './run.ts';

/** raster2pgsql … | psql: loads all GeoTIFFs of a product into one table */
export function loadRasters(table: string, files: string[]): Promise<void> {
	return new Promise((resolve, reject) => {
		const env = { ...process.env, ...pgEnv() };
		const r2p = spawn(
			tools.raster2pgsql,
			['-s', '4326', '-t', '128x128', '-F', '-I', '-d', ...files, table],
			{ env, stdio: ['ignore', 'pipe', 'inherit'] }
		);
		const psql = spawn(tools.psql, ['-q', '-v', 'ON_ERROR_STOP=1', '-o', 'NUL'], {
			env,
			stdio: ['pipe', 'inherit', 'inherit']
		});
		r2p.stdout.pipe(psql.stdin);
		let failed = false;
		const fail = (what: string) => (code: number | null) => {
			if (code !== 0 && !failed) {
				failed = true;
				reject(new Error(`${what} exited with ${code} while loading ${table}`));
			}
		};
		r2p.on('exit', fail('raster2pgsql'));
		psql.on('exit', (code) => {
			fail('psql')(code);
			if (!failed) resolve();
		});
	});
}
