import { json } from '@sveltejs/kit';
import { cities } from '#lib/config/cities.ts';
import { getSnapshot, NOTICE } from '#lib/server/live.ts';
import type { RequestHandler } from './$types';

/** All five cities with a compact live snapshot (for the home page) */
export const GET: RequestHandler = async () =>
	json(
		{ cities: await Promise.all(cities.map(getSnapshot)), notice: NOTICE },
		{ headers: { 'cache-control': 'public, max-age=300' } }
	);
