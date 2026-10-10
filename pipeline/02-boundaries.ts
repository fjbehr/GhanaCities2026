/**
 * Imports geoBoundaries ADM1 (regions) and ADM2 (MMDAs) and assigns districts to the
 * five study areas. Re-running replaces boundaries and clears dependent indicators.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { sql } from './lib/db.ts';
import { RAW } from './lib/env.ts';

interface Feature {
	properties: { shapeName: string; shapeID: string };
	geometry: object;
}

/** Loads a geoBoundaries GeoJSON (EPSG:4326) into staging_<level> */
async function stage(level: 'ADM1' | 'ADM2') {
	const table = `staging_${level.toLowerCase()}`;
	const file = path.join(RAW, 'geoboundaries', `GHA-${level}.geojson`);
	const { features } = JSON.parse(await readFile(file, 'utf8')) as { features: Feature[] };

	await sql.unsafe(`DROP TABLE IF EXISTS ${table}`);
	await sql.unsafe(`CREATE TABLE ${table} (shapeid text, shapename text, geom geometry)`);
	for (const f of features) {
		await sql.unsafe(
			`INSERT INTO ${table} VALUES ($1, $2, ST_SetSRID(ST_GeomFromGeoJSON($3), 4326))`,
			[f.properties.shapeID, f.properties.shapeName, JSON.stringify(f.geometry)]
		);
	}
	console.log(`${level}: ${features.length} features`);
}

try {
	await stage('ADM1');
	await stage('ADM2');

	await sql.begin(async (tx) => {
		await tx`DELETE FROM indicator`;
		await tx`DELETE FROM district`;
		await tx`DELETE FROM region`;
		await tx`
			INSERT INTO region (shape_id, name, geom)
			SELECT shapeid, shapename, ST_Multi(ST_CollectionExtract(ST_MakeValid(geom), 3)) FROM staging_adm1`;
		await tx`
			INSERT INTO district (shape_id, name, region, area_km2, geom)
			SELECT d.shapeid, d.shapename, r.name,
				ST_Area(d.geom::geography) / 1e6,
				ST_Multi(ST_CollectionExtract(ST_MakeValid(d.geom), 3))
			FROM staging_adm2 d
			LEFT JOIN region r ON ST_Contains(r.geom, ST_PointOnSurface(d.geom))`;

		// A district belongs to a city when it lies in the same region and contains the centre
		// or lies mostly inside the study area
		await tx`
			UPDATE district d SET city_slug = c.slug
			FROM city c
			WHERE d.region = c.region || ' Region'
				AND ST_Intersects(d.geom, c.bbox)
				AND (ST_Contains(d.geom, c.center)
					OR ST_Area(ST_Intersection(d.geom, c.bbox)::geography) >= 0.5 * ST_Area(d.geom::geography))`;
		await tx`DROP TABLE staging_adm1, staging_adm2`;
	});

	const [{ regions, districts }] = await sql`
		SELECT (SELECT count(*) FROM region)::int AS regions, (SELECT count(*) FROM district)::int AS districts`;
	console.log(`${regions} regions, ${districts} districts`);
	const perCity = await sql`
		SELECT city_slug, count(*)::int AS n, string_agg(name, ', ' ORDER BY name) AS names
		FROM district WHERE city_slug IS NOT NULL GROUP BY city_slug ORDER BY city_slug`;
	for (const r of perCity) console.log(`  ${r.city_slug}: ${r.n} — ${r.names}`);
} finally {
	await sql.end();
}
