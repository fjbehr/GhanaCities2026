/**
 * Builds the Masterportal into static/portal (served under /portal):
 * fetches the pinned release once (mastercode/), then writes the portal "ghana"
 * from the sources in portal-config/.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { download } from '../pipeline/lib/download.ts';
import { RAW, ROOT } from '../pipeline/lib/env.ts';
import { basemapStyle } from './basemap.ts';
import { portalConfig, vectorStyles } from './config.ts';

const VERSION = '3.27.1';
const MASTERCODE = VERSION.replaceAll('.', '_');
const SRC = path.join(ROOT, 'portal-config');
const OUT = path.join(ROOT, 'static', 'portal');
const PORTAL = path.join(OUT, 'ghana');

async function mastercode() {
	const target = path.join(OUT, 'mastercode', MASTERCODE);
	if (existsSync(target)) return;
	const zip = path.join(RAW, 'masterportal', `examples-${VERSION}-lts.zip`);
	await download(
		`https://bitbucket.org/geowerkstatt-hamburg/masterportal/downloads/examples-${VERSION}-lts.zip`,
		zip
	);
	await mkdir(OUT, { recursive: true });
	// Windows ships bsdtar, which unpacks zip archives
	const res = spawnSync('tar', ['-xf', zip, '-C', OUT, `mastercode/${MASTERCODE}`], {
		stdio: 'inherit'
	});
	if (res.status !== 0) throw new Error('Could not unpack the Masterportal release');
	console.log(`Masterportal ${VERSION} → static/portal/mastercode/${MASTERCODE}`);
}

const json = (file: string, data: unknown) =>
	writeFile(path.join(PORTAL, file), JSON.stringify(data, null, '\t'));

await mastercode();
await rm(PORTAL, { recursive: true, force: true });
await mkdir(path.join(PORTAL, 'resources', 'img'), { recursive: true });

const html = await readFile(path.join(SRC, 'index.html'), 'utf8');
await writeFile(path.join(PORTAL, 'index.html'), html.replaceAll('%MASTERCODE%', MASTERCODE));
await cp(path.join(SRC, 'config.js'), path.join(PORTAL, 'config.js'));
await json('config.json', portalConfig());
await json('resources/rest-services.json', []);
await json('resources/style_v3.json', vectorStyles());
await json('resources/basemap-style.json', basemapStyle());
console.log('portal written to static/portal/ghana (services.json is served by the site)');
