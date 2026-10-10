/** [west, south, east, north] in WGS84 degrees */
export type BBox = [number, number, number, number];

export interface City {
	slug: string;
	name: string;
	/** Administrative region (ADM1) */
	region: string;
	/** [lon, lat], used for live weather/air queries and the initial map view */
	center: [number, number];
	/**
	 * Study area: the contiguous built-up metropolitan area. Districts (MMDAs)
	 * whose largest part lies inside it belong to the city.
	 */
	bbox: BBox;
	/**
	 * A river the GloFAS flood model resolves well enough to matter for the city. Small urban
	 * streams such as the Odaw are below its ~5 km resolution, so most cities have none.
	 */
	river?: { name: string; at: [number, number] };
}

export const cities = [
	{
		slug: 'accra',
		name: 'Accra',
		region: 'Greater Accra',
		center: [-0.187, 5.603],
		bbox: [-0.45, 5.5, 0.1, 5.85],
		// Upstream of Weija: releases from the dam have flooded western Accra
		river: { name: 'Densu (above Weija)', at: [-0.375, 5.825] }
	},
	{
		slug: 'kumasi',
		name: 'Kumasi',
		region: 'Ashanti',
		center: [-1.624, 6.688],
		bbox: [-1.75, 6.58, -1.48, 6.8]
	},
	{
		slug: 'tamale',
		name: 'Tamale',
		region: 'Northern',
		center: [-0.853, 9.404],
		bbox: [-0.95, 9.33, -0.75, 9.5]
	},
	{
		slug: 'sekondi-takoradi',
		name: 'Sekondi-Takoradi',
		region: 'Western',
		center: [-1.755, 4.927],
		bbox: [-1.85, 4.87, -1.65, 5.03]
	},
	{
		slug: 'cape-coast',
		name: 'Cape Coast',
		region: 'Central',
		center: [-1.246, 5.106],
		bbox: [-1.35, 5.08, -1.18, 5.17]
	}
] as const satisfies readonly City[];

export type CitySlug = (typeof cities)[number]['slug'];

export function getCity(slug: string): City | undefined {
	return cities.find((c) => c.slug === slug);
}
