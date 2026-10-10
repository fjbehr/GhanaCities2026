import { error, json } from '@sveltejs/kit';
import { getCity } from '#lib/config/cities.ts';
import { getIndicators } from '#lib/server/indicators.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	if (!getCity(params.slug)) error(404, `Unknown city "${params.slug}"`);
	return json(await getIndicators(params.slug), {
		headers: { 'cache-control': 'public, max-age=3600' }
	});
};
