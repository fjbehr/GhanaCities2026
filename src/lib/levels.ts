/**
 * Plain-language levels for live conditions. Thresholds are fixed and published on /data;
 * they are this site's own reading of open data, not official warnings (those come from
 * the Ghana Meteorological Agency and NADMO).
 */

/** Ordered from calm to severe; `calm` is shown as "Nothing unusual" rather than as an alert */
export type Level = 'calm' | 'watch' | 'act' | 'severe';

export interface Reading {
	level: Level;
	/** Short headline, e.g. "Heavy rain likely" */
	label: string;
	/** One sentence of advice for residents */
	advice: string;
}

const order: Level[] = ['calm', 'watch', 'act', 'severe'];
export const worst = (levels: Level[]): Level =>
	levels.reduce((a, b) => (order.indexOf(b) > order.indexOf(a) ? b : a), 'calm' as Level);

/**
 * Rain over the next 24 hours. Daily totals of 30 mm and more regularly flood low-lying
 * streets in Accra and Kumasi; an hour of 20 mm overwhelms open drains on its own.
 */
export const RAIN = { watch: 10, act: 30, severe: 50, intenseHour: 20 };

export function rainLevel(total24h: number, maxHour: number): Reading {
	if (total24h >= RAIN.severe)
		return {
			level: 'severe',
			label: 'Very heavy rain likely',
			advice: 'Avoid low roads and drains; move valuables off the floor in flood-prone areas.'
		};
	if (total24h >= RAIN.act || maxHour >= RAIN.intenseHour)
		return {
			level: 'act',
			label: 'Heavy rain likely',
			advice: 'Keep drains clear and avoid crossing flooded roads or gutters.'
		};
	if (total24h >= RAIN.watch)
		return {
			level: 'watch',
			label: 'Rain expected',
			advice: 'Plan travel around the heaviest showers.'
		};
	return { level: 'calm', label: 'No heavy rain expected', advice: '' };
}

/**
 * Feels-like daily maximum (°C). Values of 32–39 °C (the US National Weather Service's
 * "extreme caution" band) are ordinary in Ghana, so alerts start at its "danger" band (39 °C);
 * 45 °C is the middle of that band and 51 °C begins "extreme danger".
 */
export const HEAT = { watch: 39, act: 45, severe: 51 };

export function heatLevel(feelsLikeMax: number): Reading {
	if (feelsLikeMax >= HEAT.severe)
		return {
			level: 'severe',
			label: 'Extreme heat',
			advice: 'Stay out of the sun, drink water often and check on older people and children.'
		};
	if (feelsLikeMax >= HEAT.act)
		return {
			level: 'act',
			label: 'Dangerous heat',
			advice: 'Avoid hard work in the midday sun and drink water before you are thirsty.'
		};
	if (feelsLikeMax >= HEAT.watch)
		return {
			level: 'watch',
			label: 'Very hot',
			advice: 'Drink water often and seek shade around midday.'
		};
	return { level: 'calm', label: 'No unusual heat', advice: '' };
}

/**
 * Fine dust (PM2.5) and coarse dust (PM10, Harmattan) in µg/m³, using the US EPA AQI
 * breakpoints of 2024 (also used by IQAir). The worse of the two decides.
 */
export const AIR = {
	pm25: { watch: 9.1, act: 35.5, severe: 55.5 },
	pm10: { watch: 55, act: 155, severe: 255 }
};

export function airLevel(pm25: number, pm10: number, dustShare = 0): Reading {
	const band = (v: number, t: { watch: number; act: number; severe: number }): Level =>
		v >= t.severe ? 'severe' : v >= t.act ? 'act' : v >= t.watch ? 'watch' : 'calm';
	const level = worst([band(pm25, AIR.pm25), band(pm10, AIR.pm10)]);
	const dusty = dustShare >= 0.5 && level !== 'calm';
	if (level === 'severe')
		return {
			level,
			label: dusty ? 'Unhealthy dust (Harmattan)' : 'Unhealthy air',
			advice: 'Limit time outdoors; cover nose and mouth when you go out.'
		};
	if (level === 'act')
		return {
			level,
			label: dusty ? 'Dusty air (Harmattan)' : 'Unhealthy air for sensitive groups',
			advice: 'People with asthma, older people and children should limit hard activity outdoors.'
		};
	if (level === 'watch')
		return {
			level,
			label: dusty ? 'Some dust in the air' : 'Moderate air quality',
			advice: 'Unusually sensitive people may want to take it easy outdoors.'
		};
	return { level, label: 'Good air quality', advice: '' };
}

/** River discharge compared with the same river cell over the last two years */
export function riverLevel(forecastMax: number, p90: number, p99: number): Reading {
	if (forecastMax >= p99)
		return {
			level: 'act',
			label: 'River very high',
			advice: 'Stay away from river banks and low land near the river.'
		};
	if (forecastMax >= p90)
		return {
			level: 'watch',
			label: 'River higher than usual',
			advice: 'Watch for rising water near the river.'
		};
	return { level: 'calm', label: 'River at usual levels', advice: '' };
}
