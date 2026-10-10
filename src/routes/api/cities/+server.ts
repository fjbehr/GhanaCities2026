import { json } from '@sveltejs/kit';
import { cities } from '#lib/config/cities.ts';
import { getLive, NOTICE } from '#lib/server/live.ts';
import type { RequestHandler } from './$types';

/** All five cities with a compact live snapshot (for the home page) */
export const GET: RequestHandler = async () => {
	const snapshots = await Promise.all(
		cities.map(async (c) => {
			const live = await getLive(c);
			return {
				slug: c.slug,
				name: c.name,
				region: c.region,
				headline: live.headline,
				temperature: live.weather?.data.temperature ?? null,
				feelsLikeMax: live.weather?.data.next24h.feelsLikeMax ?? null,
				rainNext24h: live.weather?.data.next24h.rainTotal ?? null,
				air: live.readings.air ?? null,
				pm25: live.air?.data.next24h.pm25 ?? null,
				updated: live.weather?.fetchedAt ?? null,
				stale: Boolean(live.weather?.stale || live.air?.stale),
				unavailable: live.unavailable
			};
		})
	);
	return json(
		{ cities: snapshots, notice: NOTICE },
		{ headers: { 'cache-control': 'public, max-age=300' } }
	);
};
