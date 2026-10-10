import { existsSync } from 'node:fs';
import path from 'node:path';

export const ROOT = path.resolve(import.meta.dirname, '../..');
export const RAW = path.join(ROOT, 'data', 'raw');
export const DERIVED = path.join(ROOT, 'data', 'derived');

if (existsSync(path.join(ROOT, '.env'))) process.loadEnvFile(path.join(ROOT, '.env'));

export function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`${name} is not set in .env`);
	return value;
}

export const PG_BIN = process.env.PG_BIN ?? 'C:/Program Files/PostgreSQL/18/bin';

/** Command-line tools used by the pipeline (PostGIS bundle, portable tools in tools/) */
export const tools = {
	psql: path.join(PG_BIN, 'psql.exe'),
	raster2pgsql: path.join(PG_BIN, 'raster2pgsql.exe'),
	osm2pgsql: path.join(ROOT, 'tools', 'osm2pgsql', 'osm2pgsql-bin', 'osm2pgsql.exe'),
	pmtiles: path.join(ROOT, 'tools', 'pmtiles', 'pmtiles.exe')
};

/** Connection parts of DATABASE_URL, e.g. for libpq command-line tools */
export function dbParams() {
	const url = new URL(requireEnv('DATABASE_URL'));
	return {
		host: url.hostname,
		port: url.port || '5432',
		user: decodeURIComponent(url.username),
		password: decodeURIComponent(url.password),
		database: url.pathname.slice(1)
	};
}
