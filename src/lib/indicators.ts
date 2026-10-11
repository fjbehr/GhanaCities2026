/** Helpers for reading the indicator payload of a city (shared by page and components) */
import type { TopicSlug } from './config/topics.ts';

export interface Series {
	key: string;
	topic: string;
	unit: string;
	source: string;
	values: { period: string; value: number | null }[];
}

export type DistrictRow = Record<string, string | number | null>;

export function series(all: Series[], key: string): Series | undefined {
	return all.find((s) => s.key === key);
}

/** The single value of a series without periods, or of one period */
export function value(all: Series[], key: string, period?: string): number | null {
	const s = series(all, key);
	if (!s) return null;
	const v = period === undefined ? s.values[0] : s.values.find((x) => x.period === period);
	return v?.value ?? null;
}

/** District with the highest / lowest value of a column */
export function extreme(rows: DistrictRow[], column: string, which: 'max' | 'min') {
	const valid = rows.filter((r) => typeof r[column] === 'number') as (DistrictRow & {
		name: string;
	})[];
	if (!valid.length) return null;
	const pick = valid.reduce((a, b) =>
		which === 'max'
			? (b[column] as number) > (a[column] as number)
				? b
				: a
			: (b[column] as number) < (a[column] as number)
				? b
				: a
	);
	return { name: String(pick.name), value: pick[column] as number };
}

export interface Column {
	key: string;
	label: string;
	unit?: string;
	digits?: number;
}

/** District table columns per topic (keys of the gs_district view) */
export const tableColumns: Record<TopicSlug, Column[]> = {
	flood: [
		{ key: 'population', label: 'Residents' },
		{ key: 'pop_low_lying_pct', label: 'Residents in low-lying areas', unit: '%', digits: 1 },
		{ key: 'area_low_lying_pct', label: 'Low-lying land', unit: '%', digits: 1 },
		{ key: 'surface_water_pct', label: 'Often under water', unit: '%', digits: 1 }
	],
	'heat-air': [
		{ key: 'surface_temp_c', label: 'Surface temperature', unit: '°C', digits: 1 },
		{ key: 'heat_vs_city_c', label: 'Against city average', unit: '°C', digits: 1 },
		{ key: 'tree_cover_pct', label: 'Tree cover', unit: '%', digits: 1 },
		{ key: 'built_cover_pct', label: 'Built-up cover', unit: '%', digits: 1 }
	],
	services: [
		{ key: 'population', label: 'Residents' },
		{ key: 'health_2km_pct', label: 'Health ≤ 2 km', unit: '%', digits: 1 },
		{ key: 'health_5km_pct', label: 'Health ≤ 5 km', unit: '%', digits: 1 },
		{ key: 'school_2km_pct', label: 'School ≤ 2 km', unit: '%', digits: 1 },
		{ key: 'market_2km_pct', label: 'Market ≤ 2 km', unit: '%', digits: 1 }
	],
	environment: [
		{ key: 'area_km2', label: 'Area', unit: 'km²', digits: 1 },
		{ key: 'built_up_1975_km2', label: 'Built-up 1975', unit: 'km²', digits: 1 },
		{ key: 'built_up_2020_km2', label: 'Built-up 2020', unit: 'km²', digits: 1 },
		{ key: 'built_up_2030_km2', label: 'Built-up 2030 (projected)', unit: 'km²', digits: 1 },
		{ key: 'tree_cover_pct', label: 'Tree cover', unit: '%', digits: 1 }
	]
};

/** GeoServer layers of a topic: for the OGC links and the map preview (WMS layers parameter) */
export const topicServices: Record<TopicSlug, { layers: string[]; group: string }> = {
	flood: { layers: ['ghana:low_lying', 'ghana:surface_water'], group: 'ghana:flood' },
	'heat-air': { layers: ['ghana:heat'], group: 'ghana:heat_air' },
	services: {
		layers: ['ghana:district', 'ghana:poi_health', 'ghana:poi_school', 'ghana:poi_market'],
		group: 'ghana:services'
	},
	// Preview shows land cover only; built-up area over it could not be read without its own legend
	environment: {
		layers: ['ghana:landcover', 'ghana:built'],
		group: 'ghana:landcover,ghana:district_boundaries'
	}
};
