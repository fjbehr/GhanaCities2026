/**
 * Open-Meteo (CC BY 4.0): weather (ECMWF and others), air quality (Copernicus CAMS) and
 * river discharge (Copernicus GloFAS). Free for non-commercial use without an API key.
 */

const TZ = 'Africa/Accra';

type Series = Record<string, (number | null)[]> & { time: string[] };

interface ForecastResponse {
	current: Record<string, number | string>;
	hourly: Series;
	daily: Series;
}
interface AirResponse {
	current: Record<string, number | string>;
	hourly: Series;
}
interface FloodResponse {
	daily: Series;
}

export interface Weather {
	time: string;
	temperature: number;
	feelsLike: number;
	humidity: number;
	weatherCode: number;
	windSpeed: number;
	isDay: boolean;
	next24h: {
		rainTotal: number;
		rainMaxHour: number;
		rainProbabilityMax: number;
		feelsLikeMax: number;
		uvMax: number;
	};
	days: {
		date: string;
		tempMax: number;
		tempMin: number;
		feelsLikeMax: number;
		rain: number;
		rainProbability: number;
		uvMax: number;
	}[];
}

export interface Air {
	time: string;
	pm25: number;
	pm10: number;
	dust: number;
	usAqi: number;
	/** 24-hour means from now, the averaging period of the AQI */
	next24h: { pm25: number; pm10: number; dust: number };
	/** Share of PM10 that is mineral dust, i.e. Harmattan */
	dustShare: number;
}

export interface River {
	name: string;
	/** m³/s for the coming days */
	days: { date: string; discharge: number }[];
	forecastMax: number;
}

export interface RiverClimate {
	p50: number;
	p90: number;
	p99: number;
	since: string;
}

const num = (v: number | null | undefined) => (typeof v === 'number' ? v : NaN);
const round = (v: number, digits = 1) => Math.round(v * 10 ** digits) / 10 ** digits;

/** Index of the hourly entry for the current hour ("2026-10-10T22:00" style, local time) */
function hourIndex(times: string[], current: string): number {
	const i = times.indexOf(current.slice(0, 13) + ':00');
	return i >= 0 ? i : 0;
}

function window24(series: (number | null)[], from: number): number[] {
	return series
		.slice(from, from + 24)
		.map(num)
		.filter((v) => !Number.isNaN(v));
}

const sum = (v: number[]) => v.reduce((a, b) => a + b, 0);
const max = (v: number[]) => (v.length ? Math.max(...v) : NaN);
const mean = (v: number[]) => (v.length ? sum(v) / v.length : NaN);

export function parseForecast(j: ForecastResponse): Weather {
	const now = String(j.current.time);
	const i = hourIndex(j.hourly.time, now);
	return {
		time: now,
		temperature: Number(j.current.temperature_2m),
		feelsLike: Number(j.current.apparent_temperature),
		humidity: Number(j.current.relative_humidity_2m),
		weatherCode: Number(j.current.weather_code),
		windSpeed: Number(j.current.wind_speed_10m),
		isDay: Number(j.current.is_day) === 1,
		next24h: {
			rainTotal: round(sum(window24(j.hourly.precipitation, i))),
			rainMaxHour: round(max(window24(j.hourly.precipitation, i))),
			rainProbabilityMax: max(window24(j.hourly.precipitation_probability, i)),
			feelsLikeMax: round(max(window24(j.hourly.apparent_temperature, i))),
			uvMax: round(max(window24(j.hourly.uv_index, i)))
		},
		days: j.daily.time.map((date, d) => ({
			date,
			tempMax: num(j.daily.temperature_2m_max[d]),
			tempMin: num(j.daily.temperature_2m_min[d]),
			feelsLikeMax: num(j.daily.apparent_temperature_max[d]),
			rain: num(j.daily.precipitation_sum[d]),
			rainProbability: num(j.daily.precipitation_probability_max[d]),
			uvMax: num(j.daily.uv_index_max[d])
		}))
	};
}

export function parseAir(j: AirResponse): Air {
	const now = String(j.current.time);
	const i = hourIndex(j.hourly.time, now);
	const pm10 = round(mean(window24(j.hourly.pm10, i)));
	const dust = round(mean(window24(j.hourly.dust, i)));
	return {
		time: now,
		pm25: Number(j.current.pm2_5),
		pm10: Number(j.current.pm10),
		dust: Number(j.current.dust),
		usAqi: Number(j.current.us_aqi),
		next24h: { pm25: round(mean(window24(j.hourly.pm2_5, i))), pm10, dust },
		dustShare: pm10 > 0 ? round(Math.min(1, dust / pm10), 2) : 0
	};
}

export function parseFlood(j: FloodResponse, name: string, today: string): River {
	const days = j.daily.time
		.map((date, d) => ({ date, discharge: num(j.daily.river_discharge[d]) }))
		.filter((d) => d.date >= today && !Number.isNaN(d.discharge));
	return { name, days, forecastMax: round(max(days.map((d) => d.discharge)), 2) };
}

/** Percentiles of daily discharge over a historical period */
export function parseRiverClimate(j: FloodResponse): RiverClimate {
	const v = j.daily.river_discharge
		.map(num)
		.filter((x) => !Number.isNaN(x))
		.sort((a, b) => a - b);
	if (!v.length) throw new Error('No river discharge history');
	const q = (p: number) => round(v[Math.floor(p * (v.length - 1))], 2);
	return { p50: q(0.5), p90: q(0.9), p99: q(0.99), since: j.daily.time[0] };
}

async function getJson<T>(url: string): Promise<T> {
	const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
	if (!res.ok) throw new Error(`Open-Meteo ${res.status}: ${url.split('?')[0]}`);
	return (await res.json()) as T;
}

const at = ([lon, lat]: [number, number]) => `latitude=${lat}&longitude=${lon}`;

export async function fetchWeather(point: [number, number]) {
	return parseForecast(
		await getJson<ForecastResponse>(
			`https://api.open-meteo.com/v1/forecast?${at(point)}&timezone=${encodeURIComponent(TZ)}&forecast_days=3` +
				'&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day' +
				'&hourly=precipitation,precipitation_probability,apparent_temperature,uv_index' +
				'&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_sum,precipitation_probability_max,uv_index_max'
		)
	);
}

export async function fetchAir(point: [number, number]) {
	return parseAir(
		await getJson<AirResponse>(
			`https://air-quality-api.open-meteo.com/v1/air-quality?${at(point)}&timezone=${encodeURIComponent(TZ)}&forecast_days=2` +
				'&current=pm10,pm2_5,dust,us_aqi&hourly=pm10,pm2_5,dust'
		)
	);
}

export async function fetchRiver(name: string, point: [number, number], today: string) {
	return parseFlood(
		await getJson<FloodResponse>(
			`https://flood-api.open-meteo.com/v1/flood?${at(point)}&daily=river_discharge&forecast_days=7`
		),
		name,
		today
	);
}

export async function fetchRiverClimate(point: [number, number], today: string) {
	const from = new Date(`${today}T00:00:00Z`);
	from.setUTCFullYear(from.getUTCFullYear() - 2);
	return parseRiverClimate(
		await getJson<FloodResponse>(
			`https://flood-api.open-meteo.com/v1/flood?${at(point)}&daily=river_discharge` +
				`&start_date=${from.toISOString().slice(0, 10)}&end_date=${today}`
		)
	);
}
