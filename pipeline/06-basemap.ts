/**
 * Extracts Ghana (zoom 0–15, ~230 MB) from the latest Protomaps daily OpenStreetMap
 * build into data/derived/basemap/ghana.pmtiles, served by `pmtiles serve` under /basemap.
 */
import { existsSync } from 'node:fs';
import { mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { fetchRetry, refresh } from './lib/download.ts';
import { DERIVED, tools } from './lib/env.ts';
import { run } from './lib/run.ts';

const GHANA_BBOX = '-3.27,4.7,1.2,11.18';
const out = path.join(DERIVED, 'basemap', 'ghana.pmtiles');

if (existsSync(out) && !refresh) {
	console.log(`${out} exists; pass --refresh to extract a newer build`);
} else {
	const builds: { key: string }[] = await (
		await fetchRetry('https://build-metadata.protomaps.dev/builds.json')
	).json();
	const latest = builds
		.map((b) => b.key)
		.sort()
		.at(-1);
	if (!latest) throw new Error('No Protomaps builds listed');

	await mkdir(path.dirname(out), { recursive: true });
	const part = `${out}.part`;
	await rm(part, { force: true });
	await run(tools.pmtiles, [
		'extract',
		`https://build.protomaps.com/${latest}`,
		part,
		`--bbox=${GHANA_BBOX}`,
		'--maxzoom=15'
	]);
	await rename(part, out);
	console.log(`basemap from build ${latest} → ${out}`);
}
