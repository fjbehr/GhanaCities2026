/**
 * Computes all long-term indicators per district and per city (district_id NULL)
 * and prints plausibility checks. Replaces previous indicator rows.
 */
import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { cities } from '../src/lib/config/cities.ts';
import type { TransactionSql } from 'postgres';
import { sql } from './lib/db.ts';
import { RAW } from './lib/env.ts';
import { clip, mean } from './lib/raster.ts';
import { GHSL_EPOCHS } from './lib/tiles.ts';

export const ACCESS_DISTANCES = [2000, 5000];
// Water points are mapped too sparsely in OSM outside Accra for an access indicator;
// they stay in the poi table and on the map only.
export const FACILITIES = ['health', 'school', 'market'] as const;

/** CHIRPS and CHPclim mark ocean cells with -9999 but do not tag it in the files */
const CHIRPS_NODATA = { nodata: -9999 };

/** ESA WorldCover 2021 classes */
const LANDCOVER: Record<number, string> = {
	10: 'tree',
	20: 'shrub',
	30: 'grass',
	40: 'cropland',
	50: 'built',
	60: 'bare',
	80: 'water',
	90: 'wetland',
	95: 'mangrove'
};

type Tx = TransactionSql;

/** Population cells (WorldPop 100 m centroids) per district, with nearest-facility distances */
async function populationCells(tx: Tx) {
	await tx`
		CREATE TEMP TABLE pop_cell ON COMMIT DROP AS
		SELECT d.shape_id, d.city_slug, px.val AS pop, px.geom
		FROM district d
		JOIN r_population r ON r.filename = d.city_slug || '.tif' AND ST_Intersects(r.rast, d.geom)
		CROSS JOIN LATERAL ST_PixelAsCentroids(r.rast) px
		WHERE d.city_slug IS NOT NULL AND px.val > 0 AND ST_Intersects(px.geom, d.geom)`;
	await tx`CREATE INDEX ON pop_cell USING gist (geom)`;
	await tx`ALTER TABLE pop_cell ADD COLUMN low_lying boolean`;
	await tx`
		UPDATE pop_cell p SET low_lying = ST_Value(l.rast, p.geom) = 1
		FROM r_low_lying l
		WHERE l.filename = p.city_slug || '.tif' AND ST_Intersects(l.rast, p.geom)`;
	for (const category of FACILITIES) {
		await tx.unsafe(`ALTER TABLE pop_cell ADD COLUMN dist_${category} double precision`);
		await tx.unsafe(
			`UPDATE pop_cell p SET dist_${category} = (
				SELECT ST_Distance(p.geom::geography, f.geom::geography)
				FROM poi f WHERE f.category = $1
				ORDER BY f.geom <-> p.geom LIMIT 1)`,
			[category]
		);
	}
	await tx`ANALYZE pop_cell`;
}

async function populationIndicators(tx: Tx) {
	await tx`
		INSERT INTO indicator (city_slug, district_id, topic, key, period, value, unit, source)
		SELECT city_slug, shape_id, 'services', 'population', '2025', sum(pop), 'people', 'WorldPop R2025A'
		FROM pop_cell GROUP BY GROUPING SETS ((city_slug, shape_id), (city_slug))`;

	for (const category of FACILITIES) {
		for (const meters of ACCESS_DISTANCES) {
			await tx.unsafe(
				`INSERT INTO indicator (city_slug, district_id, topic, key, period, value, unit, source)
				SELECT city_slug, shape_id, 'services', $1, '2025',
					100 * sum(pop) FILTER (WHERE dist_${category} <= $2) / nullif(sum(pop), 0),
					'%', 'WorldPop R2025A; OpenStreetMap'
				FROM pop_cell GROUP BY GROUPING SETS ((city_slug, shape_id), (city_slug))`,
				[`pop_within_${meters / 1000}km_${category}`, meters]
			);
		}
	}

	await tx`
		INSERT INTO indicator (city_slug, district_id, topic, key, period, value, unit, source)
		SELECT city_slug, shape_id, 'flood', 'pop_low_lying', '2025',
			100 * sum(pop) FILTER (WHERE low_lying) / nullif(sum(pop), 0),
			'%', 'Copernicus DEM GLO-30; WorldPop R2025A'
		FROM pop_cell GROUP BY GROUPING SETS ((city_slug, shape_id), (city_slug))`;
}

/** Cell counts per raster value inside each district, summed over tiles */
async function valueCounts(tx: Tx, table: string, filename: (slug: string) => string) {
	await tx.unsafe(`DROP TABLE IF EXISTS vc`);
	await tx.unsafe(
		`CREATE TEMP TABLE vc ON COMMIT DROP AS
		SELECT d.shape_id, d.city_slug, v.value, sum(v.count)::double precision AS n
		FROM district d
		JOIN ${table} r ON ST_Intersects(r.rast, d.geom)
		CROSS JOIN LATERAL ST_ValueCount(ST_Clip(r.rast, d.geom, true)) v
		WHERE d.city_slug IS NOT NULL AND r.filename = ${filename('d.city_slug')}
		GROUP BY d.shape_id, d.city_slug, v.value`
	);
}

async function rasterShareIndicators(tx: Tx) {
	await valueCounts(tx, 'r_low_lying', (s) => `${s} || '.tif'`);
	await tx`
		INSERT INTO indicator (city_slug, district_id, topic, key, period, value, unit, source)
		SELECT city_slug, shape_id, 'flood', 'area_low_lying', '',
			coalesce(100 * sum(n) FILTER (WHERE value = 1) / nullif(sum(n), 0), 0), '%', 'Copernicus DEM GLO-30'
		FROM vc GROUP BY GROUPING SETS ((city_slug, shape_id), (city_slug))`;

	// Occurrence ≥ 50 %: water in at least half of all observations 1984–2021
	await valueCounts(tx, 'r_surface_water', (s) => `${s} || '.tif'`);
	await tx`
		INSERT INTO indicator (city_slug, district_id, topic, key, period, value, unit, source)
		SELECT city_slug, shape_id, 'flood', 'area_surface_water', '1984-2021',
			coalesce(100 * sum(n) FILTER (WHERE value BETWEEN 50 AND 100) / nullif(sum(n), 0), 0),
			'%', 'JRC Global Surface Water v1.4'
		FROM vc GROUP BY GROUPING SETS ((city_slug, shape_id), (city_slug))`;

	await valueCounts(tx, 'r_landcover', (s) => `${s} || '.tif'`);
	for (const [value, name] of Object.entries(LANDCOVER)) {
		await tx`
			INSERT INTO indicator (city_slug, district_id, topic, key, period, value, unit, source)
			SELECT city_slug, shape_id, 'environment', ${'landcover_' + name}, '2021',
				coalesce(100 * sum(n) FILTER (WHERE value = ${Number(value)}) / nullif(sum(n), 0), 0),
				'%', 'ESA WorldCover 2021 v200'
			FROM vc GROUP BY GROUPING SETS ((city_slug, shape_id), (city_slug))`;
	}
}

/** Mean dry-season surface temperature and its difference from the city median (Landsat) */
async function heatIndicators(tx: Tx) {
	for (const [table, key] of [
		['r_lst', 'lst_dry_season_c'],
		['r_heat', 'heat_vs_city_c']
	]) {
		await tx.unsafe(
			`INSERT INTO indicator (city_slug, district_id, topic, key, period, value, unit, source)
			SELECT d.city_slug, d.shape_id, 'heat-air', $1, 'Dec–Mar 2024/25, 2025/26',
				sum(s.sum) / nullif(sum(s.count), 0), '°C', 'Landsat 8/9 Collection 2 (USGS)'
			FROM district d
			JOIN ${table} r ON r.filename = d.city_slug || '.tif' AND ST_Intersects(r.rast, d.geom)
			CROSS JOIN LATERAL ST_SummaryStats(ST_Clip(r.rast, d.geom, true)) s
			WHERE d.city_slug IS NOT NULL
			GROUP BY GROUPING SETS ((d.city_slug, d.shape_id), (d.city_slug))`,
			[key]
		);
	}
}

async function builtUpIndicators(tx: Tx) {
	for (const epoch of GHSL_EPOCHS) {
		await tx`
			INSERT INTO indicator (city_slug, district_id, topic, key, period, value, unit, source)
			SELECT d.city_slug, d.shape_id, 'environment', 'built_up_km2', ${String(epoch)},
				sum((ST_SummaryStats(ST_Clip(r.rast, d.geom, true))).sum) / 1e6,
				'km²', 'GHSL GHS-BUILT-S R2023A'
			FROM district d
			JOIN r_built r ON ST_Intersects(r.rast, d.geom)
				AND r.filename = d.city_slug || ${'_' + epoch + '.tif'}
			WHERE d.city_slug IS NOT NULL
			GROUP BY GROUPING SETS ((d.city_slug, d.shape_id), (d.city_slug))`;
	}
}

/** Monthly rainfall normals (CHPclim) and recent months (CHIRPS), averaged over each study area */
async function rainfallIndicators(tx: Tx) {
	const climDir = path.join(RAW, 'chirps', 'climatology');
	const monthlyDir = path.join(RAW, 'chirps', 'monthly');
	const recent = existsSync(monthlyDir)
		? (await readdir(monthlyDir)).filter((f) => /^chirps-v2\.0\.\d{4}\.\d{2}\.tif$/.test(f))
		: [];

	for (const city of cities) {
		for (let m = 1; m <= 12; m++) {
			const mm = String(m).padStart(2, '0');
			const value = mean(
				await clip([path.join(climDir, `CHPclim2.90-90.${mm}.tif`)], city.bbox, CHIRPS_NODATA)
			);
			await tx`
				INSERT INTO indicator (city_slug, topic, key, period, value, unit, source)
				VALUES (${city.slug}, 'flood', 'rain_normal_mm', ${mm}, ${value}, 'mm', 'CHPclim v2 (CHIRPS)')`;
		}
		for (const file of recent) {
			const [, year, month] = file.match(/(\d{4})\.(\d{2})/)!;
			const value = mean(await clip([path.join(monthlyDir, file)], city.bbox, CHIRPS_NODATA));
			await tx`
				INSERT INTO indicator (city_slug, topic, key, period, value, unit, source)
				VALUES (${city.slug}, 'flood', 'rain_month_mm', ${`${year}-${month}`}, ${value}, 'mm', 'CHIRPS v2.0')`;
		}
	}
}

async function plausibility() {
	const rows = await sql`
		SELECT c.slug,
			(SELECT count(*) FROM district d WHERE d.city_slug = c.slug)::int AS districts,
			(SELECT count(*) FROM district d WHERE d.city_slug = c.slug AND NOT ST_IsValid(d.geom))::int AS invalid,
			(SELECT round(value) FROM indicator i WHERE i.city_slug = c.slug AND i.district_id IS NULL AND key = 'population') AS population,
			(SELECT round(value) FROM indicator i WHERE i.city_slug = c.slug AND i.district_id IS NULL AND key = 'pop_within_2km_health') AS health_2km,
			(SELECT round(value::numeric, 1) FROM indicator i WHERE i.city_slug = c.slug AND i.district_id IS NULL AND key = 'built_up_km2' AND period = '2020') AS built_2020,
			(SELECT round(sum(value)) FROM indicator i WHERE i.city_slug = c.slug AND key = 'rain_normal_mm') AS rain_year
		FROM city c ORDER BY c.slug`;
	console.table(rows);

	const problems: string[] = [];
	for (const r of rows) {
		if (!r.districts) problems.push(`${r.slug}: no districts`);
		if (r.invalid) problems.push(`${r.slug}: ${r.invalid} invalid district geometries`);
		if (!(Number(r.population) > 50_000))
			problems.push(`${r.slug}: population ${r.population} looks too low`);
		if (!(Number(r.rain_year) > 400 && Number(r.rain_year) < 3000))
			problems.push(`${r.slug}: annual rainfall ${r.rain_year} mm out of range`);
	}
	const [{ n }] = await sql`
		SELECT count(*)::int AS n FROM city c
		WHERE NOT EXISTS (SELECT 1 FROM poi p WHERE p.category = 'health' AND ST_Within(p.geom, c.bbox))`;
	if (n) problems.push(`${n} cities without any health facility`);
	if (problems.length) {
		console.error(`Plausibility problems:\n  ${problems.join('\n  ')}`);
		process.exitCode = 1;
	} else {
		console.log('plausibility checks passed');
	}
}

try {
	await sql.begin(async (tx) => {
		await tx`DELETE FROM indicator`;
		console.log('population cells and facility distances …');
		await populationCells(tx);
		await populationIndicators(tx);
		console.log('low-lying, surface water and land cover shares …');
		await rasterShareIndicators(tx);
		console.log('built-up area 1975–2030 …');
		await builtUpIndicators(tx);
		console.log('surface heat …');
		await heatIndicators(tx);
		console.log('rainfall …');
		await rainfallIndicators(tx);
	});
	const [{ n }] = await sql`SELECT count(*)::int AS n FROM indicator`;
	console.log(`${n} indicator values`);
	await plausibility();
} finally {
	await sql.end();
}
