/**
 * Builds the Ghana Field Map as a folder of static files that any web host can serve:
 *
 *   npm run field-map -- --geoserver https://example.org/geoserver
 *
 * Output: field-map/dist/ with index.html, config.js, config.json, resources/ (services.json
 * with the given GeoServer address) and the Masterportal code (mastercode/). No database or
 * application server is needed; all map data comes from OGC web services.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { download } from '../pipeline/lib/download.ts';
import { RAW, ROOT } from '../pipeline/lib/env.ts';

const VERSION = '3.27.1';
// Windows' own bsdtar unpacks zip archives; a GNU tar earlier in PATH (Git Bash) cannot
const WINDOWS_TAR = path.join(process.env.SystemRoot ?? 'C:/Windows', 'System32', 'tar.exe');
const MASTERCODE = VERSION.replaceAll('.', '_');
const SRC = path.join(ROOT, 'field-map');
const DIST = path.join(SRC, 'dist');

const arg = (name: string) => {
	const i = process.argv.indexOf(`--${name}`);
	return i > 0 ? process.argv[i + 1] : undefined;
};
const geoserver = (arg('geoserver') ?? 'http://localhost:3000/geoserver').replace(/\/$/, '');
if (!/^https?:\/\/[^/]+/.test(geoserver))
	throw new Error(`--geoserver must be a URL, got "${geoserver}"`);

/** Masterportal release code, unpacked once from the official example archive */
async function mastercode() {
	const target = path.join(DIST, 'mastercode', MASTERCODE);
	if (existsSync(target)) return;
	const zip = path.join(RAW, 'masterportal', `examples-${VERSION}-lts.zip`);
	await download(
		`https://bitbucket.org/geowerkstatt-hamburg/masterportal/downloads/examples-${VERSION}-lts.zip`,
		zip
	);
	await mkdir(DIST, { recursive: true });
	const res =
		process.platform === 'win32'
			? spawnSync(WINDOWS_TAR, ['-xf', zip, '-C', DIST, `mastercode/${MASTERCODE}`], {
					stdio: 'inherit'
				})
			: spawnSync('unzip', ['-q', '-o', zip, `mastercode/${MASTERCODE}/*`, '-d', DIST], {
					stdio: 'inherit'
				});
	if (res.status !== 0) throw new Error('Could not unpack the Masterportal release');
}

// Fresh copy of the configuration (the Masterportal code is kept between builds)
for (const f of ['index.html', 'config.js', 'config.json', 'resources']) {
	await rm(path.join(DIST, f), { recursive: true, force: true });
}
await mkdir(DIST, { recursive: true });
for (const f of ['index.html', 'config.js', 'config.json']) {
	await cp(path.join(SRC, f), path.join(DIST, f));
}
await cp(path.join(SRC, 'resources'), path.join(DIST, 'resources'), {
	recursive: true,
	filter: (src) => !src.endsWith('services.template.json')
});

const template = await readFile(path.join(SRC, 'resources', 'services.template.json'), 'utf8');
const services = template.replaceAll('{{GEOSERVER}}', geoserver);
JSON.parse(services); // fail early on a broken template
await writeFile(path.join(DIST, 'resources', 'services.json'), services);

await mastercode();

// Masterportal adds a decimal-degree variant of EPSG:4326 with a fixed German title; give it
// an English one (the only change made to the Masterportal code)
const projections = path.join(DIST, 'mastercode', MASTERCODE, 'js', 'initProjections.js');
const code = await readFile(projections, 'utf8');
await writeFile(
	projections,
	code.replace(
		'WGS84_Lat-Lon (Grad, Dezimal), EPSG 4326',
		'GPS coordinates in decimal degrees (WGS 84, EPSG:4326)'
	)
);
console.log(`Ghana Field Map → ${path.relative(ROOT, DIST)} (GeoServer: ${geoserver})`);
console.log('Serve the folder with any static web server, e.g.  npx http-server field-map/dist');
