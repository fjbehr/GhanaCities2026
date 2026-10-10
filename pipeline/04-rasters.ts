/**
 * Cuts every raster source to each city's analysis extent (study area plus its whole
 * districts), derives low-lying areas from the DEM, writes GeoTIFFs for GeoServer to
 * data/derived/rasters and loads them into PostGIS (tables r_<product>).
 */
import { existsSync } from 'node:fs';
import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import type { BBox } from '../src/lib/config/cities.ts';
import { analysisExtents, cityOutlines } from './lib/city-geo.ts';
import { sql } from './lib/db.ts';
import { DERIVED, RAW } from './lib/env.ts';
import { clip, writeTiff } from './lib/raster.ts';
import { loadRasters } from './lib/raster-load.ts';
import { applyMask, polygonMask } from './lib/mask.ts';
import { lowLying } from './lib/terrain.ts';
import {
	copernicusDemTile,
	GHSL_EPOCHS,
	ghslTiles,
	gridCells,
	surfaceWaterTile,
	worldCoverTile
} from './lib/tiles.ts';

const OUT = path.join(DERIVED, 'rasters');

// Low-lying: at least 5 m below the mean elevation within ~500 m (17 cells of 30 m).
// 3 m flagged a quarter to a third of all residents, too broad for a flood-relevant signal.
const LOW_LYING_RADIUS = 17;
const LOW_LYING_DEPTH = 5;

interface Product {
	/** PostGIS table r_<name> and folder under data/derived/rasters */
	name: string;
	/** Nodata for sources that declare none; must not occur as a real value */
	nodata?: number;
	/** Source tiles for an extent; missing tiles (ocean) are skipped */
	tiles: (extent: BBox) => string[];
	/** Output files per city; defaults to <city>.tif */
	variants?: { suffix: string; tiles: (extent: BBox) => string[] }[];
}

const existing = (files: string[]) => files.filter((f) => existsSync(f));

const products: Product[] = [
	{
		name: 'population',
		tiles: () => [path.join(RAW, 'worldpop', 'gha_pop_2025_CN_100m_R2025A_v1.tif')]
	},
	{
		name: 'dem',
		nodata: -32768,
		tiles: (e) =>
			existing(gridCells(e, 1).map((c) => path.join(RAW, 'dem', `${copernicusDemTile(c)}.tif`)))
	},
	{
		name: 'surface_water',
		nodata: 255, // occurrence is 0–100; 0 means never water
		tiles: (e) =>
			gridCells(e, 10).map((c) =>
				path.join(RAW, 'surface-water', `occurrence_${surfaceWaterTile(c)}v1_4_2021.tif`)
			)
	},
	{
		name: 'landcover',
		tiles: (e) =>
			gridCells(e, 3).map((c) => path.join(RAW, 'worldcover', `${worldCoverTile(c)}.tif`))
	},
	{
		name: 'built',
		nodata: 65535,
		tiles: () => [],
		variants: GHSL_EPOCHS.map((epoch) => ({
			suffix: `_${epoch}`,
			tiles: (e: BBox) =>
				ghslTiles(e).map((tile) =>
					path.join(RAW, 'ghsl', `GHS_BUILT_S_E${epoch}_GLOBE_R2023A_4326_3ss_V1_0_${tile}.tif`)
				)
		}))
	}
];

try {
	const extents = await analysisExtents();
	if (!extents.size) throw new Error('No cities in the database — run db:migrate first');
	const outlines = await cityOutlines();

	for (const product of products) {
		const dir = path.join(OUT, product.name);
		await rm(dir, { recursive: true, force: true });
		const variants = product.variants ?? [{ suffix: '', tiles: product.tiles }];

		for (const [slug, extent] of extents) {
			for (const v of variants) {
				const tiles = v.tiles(extent);
				if (!tiles.length) throw new Error(`${product.name}: no source tiles for ${slug}`);
				const c = await clip(tiles, extent);
				const mask = polygonMask(c, outlines.get(slug) ?? []);
				await writeTiff(
					path.join(dir, `${slug}${v.suffix}.tif`),
					applyMask(c, mask, product.nodata)
				);
				if (product.name === 'dem') {
					// Derive from the unmasked DEM, so cells near the outline keep their full neighbourhood
					await writeTiff(
						path.join(OUT, 'low_lying', `${slug}.tif`),
						applyMask(lowLying(c, LOW_LYING_RADIUS, LOW_LYING_DEPTH), mask)
					);
				}
				console.log(`${product.name}${v.suffix} ${slug}: ${c.width}×${c.height}`);
			}
		}
	}

	for (const name of [...products.map((p) => p.name), 'low_lying']) {
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
