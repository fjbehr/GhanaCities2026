import { cities } from '#lib/config/cities.ts';
import { getSnapshot } from '#lib/server/live.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ setHeaders }) => {
	setHeaders({ 'cache-control': 'public, max-age=300' });
	return { snapshots: await Promise.all(cities.map(getSnapshot)) };
};
