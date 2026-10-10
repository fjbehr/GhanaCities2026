import { describe, expect, it } from 'vitest';
import air from './fixtures/air-accra.json' with { type: 'json' };
import flood from './fixtures/flood-densu.json' with { type: 'json' };
import forecast from './fixtures/forecast-accra.json' with { type: 'json' };
import { parseAir, parseFlood, parseForecast, parseRiverClimate } from './open-meteo.ts';

// Fixtures are real responses for Accra (10 Oct 2026, 22:00) and the Densu river
describe('parseForecast', () => {
	const w = parseForecast(forecast as never);

	it('reads the current conditions', () => {
		expect(w).toMatchObject({ time: '2026-10-10T22:00', temperature: 26.3, feelsLike: 30.6 });
		expect(w.isDay).toBe(false);
	});

	it('summarises the next 24 hours starting at the current hour', () => {
		const i = forecast.hourly.time.indexOf('2026-10-10T22:00');
		const rain = forecast.hourly.precipitation.slice(i, i + 24) as number[];
		expect(w.next24h.rainTotal).toBeCloseTo(
			rain.reduce((a, b) => a + b, 0),
			1
		);
		expect(w.next24h.rainMaxHour).toBe(Math.max(...rain));
		expect(w.next24h.feelsLikeMax).toBeGreaterThanOrEqual(w.feelsLike - 5);
	});

	it('lists the daily outlook', () => {
		expect(w.days).toHaveLength(3);
		expect(w.days[0].date).toBe('2026-10-10');
	});
});

describe('parseAir', () => {
	const a = parseAir(air as never);

	it('reads current particles and the 24-hour means', () => {
		expect(a).toMatchObject({ pm25: 6.8, pm10: 10.6, dust: 1, usAqi: 50 });
		expect(a.next24h.pm25).toBeGreaterThan(0);
		expect(a.dustShare).toBeGreaterThanOrEqual(0);
		expect(a.dustShare).toBeLessThanOrEqual(1);
	});
});

describe('river discharge', () => {
	it('keeps only today and the forecast days', () => {
		const r = parseFlood(flood as never, 'Densu', '2026-10-11');
		expect(r.days[0].date).toBe('2026-10-11');
		expect(r.forecastMax).toBe(Math.max(...r.days.map((d) => d.discharge)));
	});

	it('derives percentiles from a history', () => {
		const history = {
			daily: {
				time: Array.from({ length: 101 }, (_, i) => `d${i}`),
				river_discharge: Array.from({ length: 101 }, (_, i) => i)
			}
		};
		expect(parseRiverClimate(history as never)).toEqual({ p50: 50, p90: 90, p99: 99, since: 'd0' });
	});
});
