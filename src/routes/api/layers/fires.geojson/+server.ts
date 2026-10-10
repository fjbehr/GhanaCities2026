import { json } from '@sveltejs/kit';
import { FIRMS_MAP_KEY } from '$app/env/private';
import { cached, pgStore } from '#lib/server/cache.ts';
import { db } from '#lib/server/db.ts';
import { fetchFires } from '#lib/server/sources/firms.ts';
import type { RequestHandler } from './$types';

const TTL = 3 * 3600;
const ATTRIBUTION = 'NASA FIRMS, VIIRS S-NPP active fires (last 48 hours)';

/** Active fires in Ghana as GeoJSON; an empty collection until a FIRMS map key is set */
export const GET: RequestHandler = async () => {
	const headers = { 'cache-control': 'public, max-age=900' };
	if (!FIRMS_MAP_KEY) {
		return json(
			{
				type: 'FeatureCollection',
				features: [],
				available: false,
				reason: 'FIRMS_MAP_KEY is not configured'
			},
			{ headers }
		);
	}
	try {
		const fires = await cached(pgStore(db()), 'fires:ghana', TTL, () => fetchFires(FIRMS_MAP_KEY!));
		return json(
			{
				...fires.data,
				available: true,
				attribution: ATTRIBUTION,
				fetchedAt: fires.fetchedAt,
				stale: fires.stale
			},
			{ headers }
		);
	} catch (e) {
		console.warn(`fires: ${(e as Error).message}`);
		return json(
			{
				type: 'FeatureCollection',
				features: [],
				available: false,
				reason: 'NASA FIRMS is not reachable'
			},
			{ headers }
		);
	}
};
