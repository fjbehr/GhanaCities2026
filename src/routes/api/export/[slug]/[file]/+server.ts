import { error, json } from '@sveltejs/kit';
import { getCity } from '#lib/config/cities.ts';
import { toCsv } from '#lib/server/csv.ts';
import { districtRows, districtsGeoJson, facilitiesGeoJson } from '#lib/server/indicators.ts';
import type { RequestHandler } from './$types';

/** Downloads per city: districts.csv, districts.geojson, facilities.geojson */
export const GET: RequestHandler = async ({ params }) => {
	if (!getCity(params.slug)) error(404, `Unknown city "${params.slug}"`);
	const filename = `ghana-cities-${params.slug}-${params.file}`;
	const headers = {
		'content-disposition': `attachment; filename="${filename}"`,
		'cache-control': 'public, max-age=3600'
	};

	switch (params.file) {
		case 'districts.csv':
			return new Response(toCsv(await districtRows(params.slug)), {
				headers: { ...headers, 'content-type': 'text/csv; charset=utf-8' }
			});
		case 'districts.geojson':
			return json(await districtsGeoJson(params.slug), {
				headers: { ...headers, 'content-type': 'application/geo+json' }
			});
		case 'facilities.geojson':
			return json(await facilitiesGeoJson(params.slug), {
				headers: { ...headers, 'content-type': 'application/geo+json' }
			});
		default:
			error(404, 'Available: districts.csv, districts.geojson, facilities.geojson');
	}
};
