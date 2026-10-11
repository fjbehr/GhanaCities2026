import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getCity } from '#lib/config/cities.ts';
import { topics, type TopicSlug } from '#lib/config/topics.ts';
import { getIndicators } from '#lib/server/indicators.ts';
import { getLive } from '#lib/server/live.ts';
import type { PageServerLoad } from './$types';

interface HeatRun {
	seasons: string[];
	cities: Record<string, { scenes: string[]; coverage: number; median: number }>;
}

/** Scene list of the Landsat heat composite (written by pipeline/04b-heat.ts) */
async function heatRun(): Promise<HeatRun | null> {
	try {
		const file = path.join(process.cwd(), 'data', 'derived', 'rasters', 'heat', 'scenes.json');
		return JSON.parse(await readFile(file, 'utf8'));
	} catch {
		return null;
	}
}

export const load: PageServerLoad = async ({ params, url, setHeaders }) => {
	const city = getCity(params.slug);
	if (!city) error(404, `We do not cover “${params.slug}” (yet).`);

	const requested = url.searchParams.get('topic');
	const topic: TopicSlug = topics.some((t) => t.slug === requested)
		? (requested as TopicSlug)
		: 'flood';

	const [live, indicators, heat] = await Promise.all([
		getLive(city),
		getIndicators(city.slug),
		heatRun()
	]);

	setHeaders({ 'cache-control': 'public, max-age=300' });
	return {
		city,
		topic,
		live,
		indicators,
		heat: heat ? { seasons: heat.seasons, ...heat.cities[city.slug] } : null,
		origin: url.origin
	};
};
