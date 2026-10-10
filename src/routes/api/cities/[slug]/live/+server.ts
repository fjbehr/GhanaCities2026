import { error, json } from '@sveltejs/kit';
import { getCity } from '#lib/config/cities.ts';
import { getLive } from '#lib/server/live.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const city = getCity(params.slug);
	if (!city) error(404, `Unknown city "${params.slug}"`);
	return json(await getLive(city), { headers: { 'cache-control': 'public, max-age=300' } });
};
