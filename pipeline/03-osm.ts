/** Imports health facilities, schools, markets and water points from the OSM extract. */
import path from 'node:path';
import { sql } from './lib/db.ts';
import { dbParams, RAW, ROOT, tools } from './lib/env.ts';
import { pgEnv, run } from './lib/run.ts';

const db = dbParams();

try {
	await run(
		tools.osm2pgsql,
		[
			'--create',
			'--output=flex',
			'--style',
			path.join(ROOT, 'pipeline', 'osm', 'poi.lua'),
			'--database',
			db.database,
			'--username',
			db.user,
			'--host',
			db.host,
			'--port',
			db.port,
			path.join(RAW, 'osm', 'ghana-latest.osm.pbf')
		],
		pgEnv()
	);

	await sql.begin(async (tx) => {
		await tx`TRUNCATE poi`;
		await tx`
			INSERT INTO poi (osm_type, osm_id, category, kind, name, tags, geom)
			SELECT lower(osm_type), osm_id, category, kind, name, coalesce(tags, '{}'), geom
			FROM osm_poi_import
			ON CONFLICT DO NOTHING`;
		await tx`DROP TABLE osm_poi_import`;
	});

	const rows = await sql`
		SELECT c.slug, p.category, count(*)::int AS n
		FROM city c JOIN poi p ON ST_Within(p.geom, c.bbox)
		GROUP BY c.slug, p.category ORDER BY c.slug, p.category`;
	const [{ total }] = await sql`SELECT count(*)::int AS total FROM poi`;
	console.log(`${total} facilities in Ghana; inside the study areas:`);
	for (const r of rows) console.log(`  ${r.slug.padEnd(17)} ${r.category.padEnd(7)} ${r.n}`);
} finally {
	await sql.end();
}
