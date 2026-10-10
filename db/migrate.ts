/**
 * Applies pending db/migrations/*.sql in order (each in its own transaction)
 * and syncs the city table from src/lib/config/cities.ts.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { cities } from '../src/lib/config/cities.ts';
import { sql } from '../pipeline/lib/db.ts';

const dir = path.join(import.meta.dirname, 'migrations');

try {
	await sql`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			name text PRIMARY KEY,
			applied_at timestamptz NOT NULL DEFAULT now()
		)`;
	const applied = new Set((await sql`SELECT name FROM schema_migrations`).map((r) => r.name));
	const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();

	for (const file of files) {
		if (applied.has(file)) continue;
		const ddl = await readFile(path.join(dir, file), 'utf8');
		await sql.begin(async (tx) => {
			await tx.unsafe(ddl);
			await tx`INSERT INTO schema_migrations (name) VALUES (${file})`;
		});
		console.log(`applied ${file}`);
	}

	for (const c of cities) {
		const [w, s, e, n] = c.bbox;
		await sql`
			INSERT INTO city (slug, name, region, center, bbox)
			VALUES (${c.slug}, ${c.name}, ${c.region},
				ST_SetSRID(ST_MakePoint(${c.center[0]}, ${c.center[1]}), 4326),
				ST_MakeEnvelope(${w}, ${s}, ${e}, ${n}, 4326))
			ON CONFLICT (slug) DO UPDATE SET
				name = excluded.name, region = excluded.region,
				center = excluded.center, bbox = excluded.bbox`;
	}
	console.log(`schema up to date (${files.length} migrations), ${cities.length} cities synced`);
} finally {
	await sql.end();
}
