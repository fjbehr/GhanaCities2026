import { spawn } from 'node:child_process';
import path from 'node:path';
import { dbParams, PG_BIN } from './env.ts';

/** Runs a command with inherited output; rejects on a non-zero exit code. */
export function run(command: string, args: string[], env: NodeJS.ProcessEnv = {}): Promise<void> {
	console.log(`$ ${path.basename(command)} ${args.join(' ')}`);
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, { stdio: 'inherit', env: { ...process.env, ...env } });
		child.on('error', reject);
		child.on('exit', (code) =>
			code === 0 ? resolve() : reject(new Error(`${path.basename(command)} exited with ${code}`))
		);
	});
}

/** libpq environment for the app database (psql, raster2pgsql, osm2pgsql) */
export function pgEnv(): NodeJS.ProcessEnv {
	const db = dbParams();
	return {
		PGHOST: db.host,
		PGPORT: db.port,
		PGUSER: db.user,
		PGPASSWORD: db.password,
		PGDATABASE: db.database,
		// raster2pgsql looks up EPSG definitions here; without it, it warns on every file
		PROJ_DATA: path.join(PG_BIN, '..', 'share', 'contrib', 'postgis-3.6', 'proj')
	};
}
