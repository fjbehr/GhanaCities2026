/**
 * Downloads all raw source data into data/raw (about 1 GB). Existing files are kept;
 * pass --refresh to fetch them again (e.g. for a newer OSM extract).
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
import { readFile } from 'node:fs/promises';
import { cities } from '../src/lib/config/cities.ts';
import { download, fetchRetry, type DownloadResult } from './lib/download.ts';
import { RAW } from './lib/env.ts';
import {
	copernicusDemTile,
	GHSL_EPOCHS,
	ghslTiles,
	gridCellsFor,
	surfaceWaterTile,
	worldCoverTile
} from './lib/tiles.ts';

const bboxes = cities.map((c) => c.bbox);

interface Job {
	source: string;
	url: string;
	dest: string;
	optional?: boolean;
	after?: (dest: string) => Promise<void>;
}

/** Extracts the GeoTIFF from a GHSL tile zip next to it (Windows ships bsdtar) */
async function unzipTif(zip: string) {
	const res = spawnSync('tar', ['-xf', zip, '-C', path.dirname(zip), '*.tif'], {
		stdio: 'inherit'
	});
	if (res.status !== 0) throw new Error(`tar failed for ${zip}`);
}

async function gunzipTo(gz: string) {
	const out = gz.replace(/\.gz$/, '');
	if (!existsSync(out)) await writeFile(out, gunzipSync(await readFile(gz)));
}

async function geoBoundariesJobs(): Promise<Job[]> {
	const jobs: Job[] = [];
	for (const level of ['ADM1', 'ADM2']) {
		const meta = await (
			await fetchRetry(`https://www.geoboundaries.org/api/current/gbOpen/GHA/${level}/`)
		).json();
		const dir = path.join(RAW, 'geoboundaries');
		await mkdir(dir, { recursive: true });
		await writeFile(path.join(dir, `${level}.meta.json`), JSON.stringify(meta, null, 2));
		jobs.push({
			source: 'geoBoundaries',
			url: meta.gjDownloadURL,
			dest: path.join(dir, `GHA-${level}.geojson`)
		});
	}
	return jobs;
}

/** The latest `count` months for which CHIRPS Africa monthly data is published */
async function chirpsJobs(count: number): Promise<Job[]> {
	const base = 'https://data.chc.ucsb.edu/products/CHIRPS-2.0/africa_monthly/tifs';
	const jobs: Job[] = [];
	const d = new Date();
	for (let tries = 0; jobs.length < count && tries < count + 6; tries++) {
		d.setUTCDate(1);
		d.setUTCMonth(d.getUTCMonth() - 1);
		const name = `chirps-v2.0.${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.tif.gz`;
		const head = await fetchRetry(`${base}/${name}`, { method: 'HEAD' });
		if (!head.ok) continue;
		jobs.push({
			source: 'CHIRPS',
			url: `${base}/${name}`,
			dest: path.join(RAW, 'chirps', 'monthly', name),
			after: gunzipTo
		});
	}
	return jobs;
}

async function jobs(): Promise<Job[]> {
	const list: Job[] = [
		...(await geoBoundariesJobs()),
		{
			source: 'OpenStreetMap',
			url: 'https://download.geofabrik.de/africa/ghana-latest.osm.pbf',
			dest: path.join(RAW, 'osm', 'ghana-latest.osm.pbf')
		},
		{
			source: 'WorldPop',
			url: 'https://data.worldpop.org/GIS/Population/Global_2015_2030/R2025A/2025/GHA/v1/100m/constrained/gha_pop_2025_CN_100m_R2025A_v1.tif',
			dest: path.join(RAW, 'worldpop', 'gha_pop_2025_CN_100m_R2025A_v1.tif')
		}
	];

	for (const cell of gridCellsFor(bboxes, 1)) {
		const name = copernicusDemTile(cell);
		list.push({
			source: 'Copernicus DEM',
			url: `https://copernicus-dem-30m.s3.amazonaws.com/${name}/${name}.tif`,
			dest: path.join(RAW, 'dem', `${name}.tif`),
			optional: true
		});
	}
	for (const cell of gridCellsFor(bboxes, 3)) {
		const name = worldCoverTile(cell);
		list.push({
			source: 'ESA WorldCover',
			url: `https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/${name}.tif`,
			dest: path.join(RAW, 'worldcover', `${name}.tif`)
		});
	}
	for (const cell of gridCellsFor(bboxes, 10)) {
		const name = surfaceWaterTile(cell);
		list.push({
			source: 'JRC Global Surface Water',
			url: `https://storage.googleapis.com/global-surface-water/downloads2021/occurrence/occurrence_${name}v1_4_2021.tif`,
			dest: path.join(RAW, 'surface-water', `occurrence_${name}v1_4_2021.tif`)
		});
	}
	for (const tile of new Set(bboxes.flatMap(ghslTiles))) {
		for (const epoch of GHSL_EPOCHS) {
			const product = `GHS_BUILT_S_E${epoch}_GLOBE_R2023A_4326_3ss`;
			const file = `${product}_V1_0_${tile}.zip`;
			list.push({
				source: 'GHSL',
				url: `https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/GHSL/GHS_BUILT_S_GLOBE_R2023A/${product}/V1-0/tiles/${file}`,
				dest: path.join(RAW, 'ghsl', file),
				after: unzipTif
			});
		}
	}
	for (let m = 1; m <= 12; m++) {
		const name = `CHPclim2.90-90.${String(m).padStart(2, '0')}.tif`;
		list.push({
			source: 'CHPclim',
			url: `https://data.chc.ucsb.edu/products/CHPclim/v2/monthly_9090/${name}`,
			dest: path.join(RAW, 'chirps', 'climatology', name)
		});
	}
	try {
		list.push(...(await chirpsJobs(12)));
	} catch (error) {
		// Recent months only feed a comparison chart; normals and everything else still load
		console.warn(`CHIRPS recent months skipped: ${(error as Error).message}`);
	}
	return list;
}

const all = await jobs();
console.log(`${all.length} files to check`);
const counts: Record<DownloadResult, number> = { downloaded: 0, cached: 0, missing: 0 };
const failures: string[] = [];

// A few downloads in parallel; hosts differ, so this does not hammer a single server
const queue = [...all];
await Promise.all(
	Array.from({ length: 4 }, async () => {
		for (let job = queue.shift(); job; job = queue.shift()) {
			try {
				const result = await download(job.url, job.dest, { optional: job.optional });
				counts[result]++;
				if (result !== 'missing') await job.after?.(job.dest);
				if (result !== 'cached') console.log(`${result}: ${job.source} ${path.basename(job.dest)}`);
			} catch (error) {
				failures.push(`${job.source} ${job.url}: ${(error as Error).message}`);
			}
		}
	})
);

console.log(
	`done: ${counts.downloaded} downloaded, ${counts.cached} already present, ${counts.missing} not published (ocean tiles)`
);
if (failures.length) {
	console.error(`${failures.length} failed:\n  ${failures.join('\n  ')}`);
	process.exitCode = 1;
}
