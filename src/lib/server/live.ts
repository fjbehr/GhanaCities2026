import type { City } from '#lib/config/cities.ts';
import { airLevel, heatLevel, rainLevel, riverLevel, worst, type Reading } from '#lib/levels.ts';
import { cached, pgStore, type Cached } from './cache.ts';
import { db } from './db.ts';
import {
	fetchAir,
	fetchRiver,
	fetchRiverClimate,
	fetchWeather,
	type Air,
	type River,
	type RiverClimate,
	type Weather
} from './sources/open-meteo.ts';

/** Cache lifetimes in seconds, matched to how often each source updates */
export const TTL = { weather: 30 * 60, air: 60 * 60, river: 6 * 3600, riverClimate: 7 * 86400 };

export type Topic = 'rain' | 'heat' | 'air' | 'river';

export interface Live {
	city: string;
	headline: Reading & { topic: Topic | null };
	readings: Partial<Record<Topic, Reading>>;
	weather: Cached<Weather> | null;
	air: Cached<Air> | null;
	river: (Cached<River> & { climate: RiverClimate }) | null;
	/** Sources that could not be reached and had no cached copy */
	unavailable: string[];
	notice: string;
}

export const NOTICE =
	'This is our reading of open forecast data, not an official warning. For warnings see the Ghana Meteorological Agency (meteo.gov.gh) and NADMO.';

const CALM: Live['headline'] = {
	level: 'calm',
	label: 'Nothing unusual today',
	advice: '',
	topic: null
};

/** The most severe reading; on a tie the first topic in this order wins */
export function headline(readings: Partial<Record<Topic, Reading>>): Live['headline'] {
	const order: Topic[] = ['rain', 'river', 'heat', 'air'];
	const level = worst(order.map((t) => readings[t]?.level ?? 'calm'));
	if (level === 'calm') return CALM;
	const topic = order.find((t) => readings[t]?.level === level)!;
	return { ...readings[topic]!, topic };
}

export async function getLive(city: City, today = new Date().toISOString().slice(0, 10)) {
	const store = pgStore(db());
	const [weather, air, river] = await Promise.allSettled([
		cached(store, `weather:${city.slug}`, TTL.weather, () => fetchWeather(city.center)),
		cached(store, `air:${city.slug}`, TTL.air, () => fetchAir(city.center)),
		city.river
			? Promise.all([
					cached(store, `river:${city.slug}`, TTL.river, () =>
						fetchRiver(city.river!.name, city.river!.at, today)
					),
					cached(store, `river-climate:${city.slug}`, TTL.riverClimate, () =>
						fetchRiverClimate(city.river!.at, today)
					)
				]).then(([r, c]) => ({ ...r, climate: c.data }))
			: Promise.resolve(null)
	]);

	const unavailable: string[] = [];
	const value = <T>(r: PromiseSettledResult<T>, name: string): T | null => {
		if (r.status === 'fulfilled') return r.value;
		unavailable.push(name);
		console.warn(`live ${city.slug} ${name}: ${(r.reason as Error).message}`);
		return null;
	};
	const w = value(weather, 'weather');
	const a = value(air, 'air quality');
	const rv = value(river, 'river');

	const readings: Live['readings'] = {};
	if (w) {
		readings.rain = rainLevel(w.data.next24h.rainTotal, w.data.next24h.rainMaxHour);
		readings.heat = heatLevel(w.data.next24h.feelsLikeMax);
	}
	if (a) readings.air = airLevel(a.data.next24h.pm25, a.data.next24h.pm10, a.data.dustShare);
	if (rv) readings.river = riverLevel(rv.data.forecastMax, rv.climate.p90, rv.climate.p99);

	return {
		city: city.slug,
		headline: headline(readings),
		readings,
		weather: w,
		air: a,
		river: rv,
		unavailable,
		notice: NOTICE
	} satisfies Live;
}
