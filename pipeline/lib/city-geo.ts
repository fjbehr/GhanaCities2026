import type { BBox } from '../../src/lib/config/cities.ts';
import { sql } from './db.ts';
import { rings } from './mask.ts';

/** Study area plus the full extent of every district assigned to the city */
export async function analysisExtents(): Promise<Map<string, BBox>> {
	const rows = await sql`
		SELECT c.slug,
			ST_XMin(e) AS w, ST_YMin(e) AS s, ST_XMax(e) AS east, ST_YMax(e) AS n
		FROM city c
		CROSS JOIN LATERAL (
			SELECT ST_Extent(g)::geometry AS e FROM (
				SELECT c.bbox AS g
				UNION ALL SELECT geom FROM district d WHERE d.city_slug = c.slug
			) parts
		) x`;
	return new Map(rows.map((r) => [r.slug, [r.w, r.s, r.east, r.n] as BBox]));
}

/** Outline of each city's districts; cells outside become nodata, so maps show the city's shape */
export async function cityOutlines(): Promise<Map<string, number[][][]>> {
	const rows = await sql`
		SELECT city_slug, ST_AsGeoJSON(ST_Union(geom)) AS geojson
		FROM district WHERE city_slug IS NOT NULL GROUP BY city_slug`;
	return new Map(rows.map((r) => [r.city_slug, rings(JSON.parse(r.geojson))]));
}
