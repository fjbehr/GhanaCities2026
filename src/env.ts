import { defineEnvVars } from '@sveltejs/kit/env';

const optional = (value: string | undefined) => value || undefined;

const url = (fallback: string) => (value: string | undefined) => {
	const raw = value || fallback;
	try {
		return new URL(raw).href.replace(/\/$/, '');
	} catch {
		throw new Error(`"${raw}" is not a valid URL`);
	}
};

export const variables = defineEnvVars({
	DATABASE_URL: {
		description: 'PostgreSQL/PostGIS connection string for the app database',
		schema: optional
	},
	GEOSERVER_URL: {
		description: 'Upstream GeoServer, proxied under /geoserver',
		schema: url('http://localhost:8081/geoserver')
	},
	BASEMAP_URL: {
		description: 'Upstream `pmtiles serve`, proxied under /basemap',
		schema: url('http://localhost:8082')
	},
	FIRMS_MAP_KEY: {
		description: 'NASA FIRMS map key; the fire layer stays off without it',
		schema: optional
	}
});
