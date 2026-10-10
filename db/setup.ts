/**
 * One-time setup as PostgreSQL superuser: creates the app role and database from
 * DATABASE_URL and enables PostGIS. Safe to re-run; it also resyncs the role's password.
 */
import postgres from 'postgres';
import { dbParams, requireEnv } from '../pipeline/lib/env.ts';

const app = dbParams();
const superuser = {
	host: app.host,
	port: Number(app.port),
	user: process.env.POSTGRES_SUPERUSER ?? 'postgres',
	password: requireEnv('POSTGRES_SUPERUSER_PASSWORD'),
	onnotice: () => {}
};

const admin = postgres({ ...superuser, database: 'postgres' });
try {
	const [role] = await admin`SELECT 1 FROM pg_roles WHERE rolname = ${app.user}`;
	const verb = role ? 'ALTER' : 'CREATE';
	const [{ ddl }] = await admin`
		SELECT format(${verb + ' ROLE %I LOGIN PASSWORD %L'}, ${app.user}::text, ${app.password}::text) AS ddl`;
	await admin.unsafe(ddl);
	console.log(`role ${app.user}: ${role ? 'password updated' : 'created'}`);

	const [db] = await admin`SELECT 1 FROM pg_database WHERE datname = ${app.database}`;
	const [{ ddl: dbDdl }] = db
		? await admin`
			SELECT format('ALTER DATABASE %I OWNER TO %I', ${app.database}::text, ${app.user}::text) AS ddl`
		: await admin`
			SELECT format('CREATE DATABASE %I OWNER %I ENCODING ''UTF8''', ${app.database}::text, ${app.user}::text) AS ddl`;
	await admin.unsafe(dbDdl);
	console.log(`database ${app.database}: ${db ? 'exists' : 'created'}`);
} finally {
	await admin.end();
}

const target = postgres({ ...superuser, database: app.database });
try {
	await target`CREATE EXTENSION IF NOT EXISTS postgis`;
	await target`CREATE EXTENSION IF NOT EXISTS postgis_raster`;
	// Allow exporting clipped rasters (ST_AsGDALRaster) for GeoServer
	const [{ drivers }] = await target`
		SELECT format('ALTER DATABASE %I SET postgis.gdal_enabled_drivers = %L', ${app.database}::text, 'GTiff PNG') AS drivers`;
	await target.unsafe(drivers);
	const [{ version }] = await target`SELECT postgis_full_version() AS version`;
	console.log(`extensions ready: ${version.split(' ').slice(0, 2).join(' ')}`);
} finally {
	await target.end();
}
