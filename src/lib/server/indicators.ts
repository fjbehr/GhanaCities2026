import { db } from './db.ts';

export interface IndicatorSeries {
	key: string;
	topic: string;
	unit: string;
	source: string;
	values: { period: string; value: number | null }[];
}

/** City-wide indicators grouped by key, plus one row per district with all figures */
export async function getIndicators(slug: string) {
	const sql = db();
	const rows = await sql<
		{
			key: string;
			topic: string;
			unit: string;
			source: string;
			period: string;
			value: number | null;
		}[]
	>`
		SELECT key, topic, unit, source, period, value
		FROM indicator WHERE city_slug = ${slug} AND district_id IS NULL
		ORDER BY key, period`;

	const series = new Map<string, IndicatorSeries>();
	for (const r of rows) {
		const s = series.get(r.key) ?? {
			key: r.key,
			topic: r.topic,
			unit: r.unit,
			source: r.source,
			values: []
		};
		s.values.push({ period: r.period, value: r.value });
		series.set(r.key, s);
	}

	return { city: slug, indicators: [...series.values()], districts: await districtRows(slug) };
}

/** Districts of a city with their indicator columns (the gs_district view without geometry) */
export async function districtRows(slug: string): Promise<Record<string, unknown>[]> {
	// SELECT * keeps the view's column order (to_jsonb would sort the keys); geometry is dropped
	const rows = await db()`SELECT * FROM gs_district WHERE city_slug = ${slug} ORDER BY name`;
	return rows.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => k !== 'geom')));
}

const ATTRIBUTION =
	'Ghana Cities. Boundaries: geoBoundaries (CC BY 4.0); population: WorldPop (CC BY 4.0); facilities: © OpenStreetMap contributors (ODbL); land cover: ESA WorldCover (CC BY 4.0); built-up: GHSL (CC BY 4.0); heat: Landsat (USGS). Methods: /data';

export async function districtsGeoJson(slug: string) {
	const [row] = await db()`
		SELECT json_build_object(
			'type', 'FeatureCollection',
			'attribution', ${ATTRIBUTION}::text,
			'features', coalesce(json_agg(json_build_object(
				'type', 'Feature',
				'geometry', ST_AsGeoJSON(d.geom, 6)::json,
				'properties', to_jsonb(d) - 'geom'
			) ORDER BY d.name), '[]'::json)
		) AS fc
		FROM gs_district d WHERE d.city_slug = ${slug}`;
	return row.fc;
}

export async function facilitiesGeoJson(slug: string) {
	const [row] = await db()`
		SELECT json_build_object(
			'type', 'FeatureCollection',
			'attribution', '© OpenStreetMap contributors (ODbL)',
			'features', coalesce(json_agg(json_build_object(
				'type', 'Feature',
				'geometry', ST_AsGeoJSON(p.geom, 6)::json,
				'properties', json_build_object(
					'category', p.category, 'kind', p.kind, 'name', p.name,
					'osm', 'https://www.openstreetmap.org/' ||
						CASE p.osm_type WHEN 'n' THEN 'node' WHEN 'w' THEN 'way' ELSE 'relation' END || '/' || p.osm_id)
			) ORDER BY p.category, p.name), '[]'::json)
		) AS fc
		FROM poi p
		WHERE EXISTS (
			SELECT 1 FROM district d WHERE d.city_slug = ${slug} AND ST_Intersects(d.geom, p.geom))`;
	return row.fc;
}
