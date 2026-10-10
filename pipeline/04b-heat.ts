/**
 * Urban heat: dry-season daytime land surface temperature from Landsat 8/9 (~10:30 local
 * time), as a cloud-free median composite per city on a 0.0005° (~55 m) grid. Writes
 *   data/derived/rasters/lst/<city>.tif   surface temperature in °C
 *   data/derived/rasters/heat/<city>.tif  difference from the city's median in °C
 * and loads both into PostGIS (r_lst, r_heat). Landsat's thermal band is 100 m natively.
 */
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { analysisExtents, cityOutlines } from './lib/city-geo.ts';
import { sql } from './lib/db.ts';
import { DERIVED } from './lib/env.ts';
import {
	gridFor,
	median,
	sampleScene,
	searchScenes,
	storageToken,
	utmCoordinates
} from './lib/landsat.ts';
import { polygonMask } from './lib/mask.ts';
import { writeTiff } from './lib/raster.ts';
import { loadRasters } from './lib/raster-load.ts';

const RES = 0.0005;
const NODATA = -9999;
/** Two dry seasons (December–March), when clear skies are most likely */
export const DRY_SEASONS = ['2024-12-01/2025-03-31', '2025-12-01/2026-03-31'];
const MAX_SCENE_CLOUD = 40; // per-pixel QA masking removes the rest
const MIN_CLEAR_OBSERVATIONS = 2;

const OUT = path.join(DERIVED, 'rasters');

try {
	const extents = await analysisExtents();
	const outlines = await cityOutlines();
	const token = await storageToken();
	const log: Record<string, { scenes: string[]; coverage: number; median: number }> = {};

	for (const dir of ['lst', 'heat'])
		await rm(path.join(OUT, dir), { recursive: true, force: true });

	for (const [slug, extent] of extents) {
		const grid = gridFor(extent, RES);
		const cells = grid.width * grid.height;
		const inCity = polygonMask(grid, outlines.get(slug) ?? []);
		const scenes = (
			await searchScenes(
				extent,
				DRY_SEASONS.map((r) => r.replace('/', 'T00:00:00Z/') + 'T23:59:59Z'),
				MAX_SCENE_CLOUD
			)
		).sort((a, b) => a.date.localeCompare(b.date));

		// One stack slice per scene; reprojected coordinates are reused per UTM zone
		const stack = new Float32Array(cells * scenes.length).fill(NaN);
		const coordsByZone = new Map<number, ReturnType<typeof utmCoordinates>>();
		const used: string[] = [];
		for (const [k, scene] of scenes.entries()) {
			if (!coordsByZone.has(scene.epsg))
				coordsByZone.set(scene.epsg, utmCoordinates(grid, scene.epsg));
			try {
				const sample = await sampleScene(scene, token, coordsByZone.get(scene.epsg)!);
				let clear = 0;
				for (let i = 0; i < cells; i++) {
					if (!Number.isNaN(sample[i])) {
						stack[i * scenes.length + k] = sample[i];
						clear++;
					}
				}
				if (clear) used.push(scene.id);
				console.log(
					`  ${slug} ${scene.date} ${scene.id}: ${Math.round((clear / cells) * 100)} % clear`
				);
			} catch (error) {
				console.warn(`  ${slug} ${scene.id} skipped: ${(error as Error).message}`);
			}
		}

		const lst = new Float32Array(cells).fill(NODATA);
		const valid: number[] = [];
		for (let i = 0; i < cells; i++) {
			if (!inCity[i]) continue;
			const m = median(
				stack.subarray(i * scenes.length, (i + 1) * scenes.length),
				MIN_CLEAR_OBSERVATIONS
			);
			if (Number.isNaN(m)) continue;
			lst[i] = m;
			valid.push(m);
		}
		const cityMedian = median(valid);
		const heat = lst.map((v) => (v === NODATA ? NODATA : v - cityMedian));
		const covered =
			valid.length /
			Math.max(
				1,
				inCity.reduce((a, b) => a + b, 0)
			);

		for (const [dir, data] of [
			['lst', lst],
			['heat', heat]
		] as const) {
			await writeTiff(path.join(OUT, dir, `${slug}.tif`), { ...grid, data, nodata: NODATA });
		}
		log[slug] = {
			scenes: used,
			coverage: Math.round(covered * 1000) / 10,
			median: Math.round(cityMedian * 10) / 10
		};
		console.log(
			`${slug}: ${used.length} scenes, ${log[slug].coverage} % of the city covered, median ${log[slug].median} °C`
		);
	}

	await mkdir(path.join(OUT, 'heat'), { recursive: true });
	await writeFile(
		path.join(OUT, 'heat', 'scenes.json'),
		JSON.stringify({ seasons: DRY_SEASONS, resolutionDeg: RES, cities: log }, null, '\t')
	);
	for (const name of ['lst', 'heat']) {
		const dir = path.join(OUT, name);
		const files = (await readdir(dir))
			.filter((f) => f.endsWith('.tif'))
			.map((f) => path.join(dir, f));
		await loadRasters(`r_${name}`, files);
		console.log(`loaded r_${name} (${files.length} files)`);
	}
} finally {
	await sql.end();
}
