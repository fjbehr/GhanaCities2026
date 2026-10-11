/**
 * Packs everything the server needs from the processing PC into one file:
 *   deploy/out/ghana-cities-data.tar.gz
 *     ghana_cities.dump        database (pg_dump, custom format)
 *     data/derived/rasters/    GeoTIFFs per city (GeoServer mosaics are rebuilt from these)
 *     data/derived/basemap/    ghana.pmtiles
 * Raw downloads and GeoServer's own copies are left out; the server rebuilds the latter.
 *
 *   npm run deploy:export
 */
import { spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { dbParams, DERIVED, PG_BIN, ROOT } from '../pipeline/lib/env.ts';

const OUT = path.join(ROOT, 'deploy', 'out');
const DUMP = path.join(OUT, 'ghana_cities.dump');
const BUNDLE = path.join(OUT, 'ghana-cities-data.tar.gz');
const PARTS = ['rasters', 'basemap'];

const mb = (file: string) => `${Math.round(statSync(file).size / 1e6)} MB`;

for (const part of PARTS) {
	if (!existsSync(path.join(DERIVED, part))) {
		throw new Error(`data/derived/${part} is missing; run the pipeline first`);
	}
}
await mkdir(OUT, { recursive: true });
await rm(BUNDLE, { force: true });

console.log('database dump …');
const db = dbParams();
const pgDump = path.join(PG_BIN, process.platform === 'win32' ? 'pg_dump.exe' : 'pg_dump');
const dump = spawnSync(
	pgDump,
	['-Fc', '-h', db.host, '-p', db.port, '-U', db.user, '-d', db.database, '-f', DUMP],
	{ stdio: 'inherit', env: { ...process.env, PGPASSWORD: db.password } }
);
if (dump.status !== 0) throw new Error('pg_dump failed');
console.log(`  ${path.relative(ROOT, DUMP)}: ${mb(DUMP)}`);

console.log('packing …');
// Relative paths only: GNU tar (e.g. from Git Bash) reads "C:\…" as a remote host
const tar = spawnSync(
	'tar',
	[
		'-czf',
		'deploy/out/ghana-cities-data.tar.gz',
		'--exclude=*.part',
		'-C',
		'deploy/out',
		'ghana_cities.dump',
		'-C',
		'../..',
		...PARTS.map((p) => `data/derived/${p}`)
	],
	{ stdio: 'inherit', cwd: ROOT }
);
if (tar.status !== 0) throw new Error('tar failed');
await rm(DUMP);

console.log(`\n${path.relative(ROOT, BUNDLE)}: ${mb(BUNDLE)}`);
console.log('Copy it to the server, e.g.:');
console.log('  scp deploy/out/ghana-cities-data.tar.gz <user>@<server>:/tmp/');
console.log('then on the server:');
console.log('  sudo bash /opt/ghana-cities/deploy/import-data.sh /tmp/ghana-cities-data.tar.gz');
