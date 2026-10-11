/**
 * Site copy in one place, so it can be translated (Twi, Ga, Dagbani) later.
 * Functions build plain-language sentences from figures.
 */
import { num, pct, people, signedDegrees } from './format.ts';

export const site = {
	name: 'Ghana Cities',
	tagline: 'Rain, heat, air and services in five Ghanaian cities',
	intro:
		'Live conditions in plain words, and open figures for every district — built from free data such as OpenStreetMap, NASA, Copernicus and WorldPop.',
	notOfficial:
		'Our reading of open forecast data, not an official warning. For warnings, follow the Ghana Meteorological Agency and NADMO.',
	gmet: 'https://www.meteo.gov.gh',
	nadmo: 'https://nadmo.gov.gh'
};

export const topicCopy = {
	flood: {
		title: 'Flood & Rain',
		summary: 'Where water collects, how much rain is normal, and what is coming.'
	},
	'heat-air': {
		title: 'Heat & Air',
		summary: 'Which parts of the city get hottest, and how clean the air is.'
	},
	services: {
		title: 'Services & Access',
		summary: 'How many people live within reach of a clinic, a school and a market.'
	},
	environment: {
		title: 'Environment',
		summary: 'How the city has grown since 1975 and what covers the land today.'
	}
} as const;

/** Notes that only make sense for one city */
export const cityNotes: Record<string, Partial<Record<keyof typeof topicCopy, string>>> = {
	tamale: {
		'heat-air':
			'In the dry season the town centre is cooler than the farmland around it: bare, dry fields heat up more than streets shaded by neem and mango trees. Shade trees are part of how Tamale keeps cool.'
	},
	accra: {
		flood:
			'Small rivers such as the Odaw are too small for the global flood model, so river levels here refer to the Densu above Weija. For the Odaw, the low-lying areas on the map are the better guide.'
	}
};

export const meaning = {
	lowLying: (share: number | null, city: string) =>
		share === null
			? ''
			: `of people in ${city} live in valley bottoms or hollows — places where rainwater runs together. After heavy rain, these streets flood first.`,
	healthAccess: (within2: number | null, within5: number | null) =>
		within2 === null
			? ''
			: `of residents live within 2 km of a clinic or hospital mapped in OpenStreetMap — about a 25-minute walk. Within 5 km it is ${pct(within5)}.`,
	heatSpread: (
		hottest: { name: string; value: number } | null,
		coolest: { name: string; value: number } | null
	) =>
		!hottest || !coolest
			? ''
			: `On dry-season days, ${hottest.name} is the hottest district (${signedDegrees(hottest.value)} against the city average), ${coolest.name} the coolest (${signedDegrees(coolest.value)}). Trees, water and open green space keep ground cooler; dense roofs and bare land heat up.`,
	growth: (from: number | null, to: number | null, city: string) =>
		from === null || to === null
			? ''
			: `${city}'s built-up area grew from ${num(from)} km² in 1975 to ${num(to)} km² in 2020 — ${num(to / from, 1)} times as large.`,
	population: (n: number | null, districts: number) =>
		`${people(n)} people live in the ${districts} ${districts === 1 ? 'district' : 'districts'} we count as the city (WorldPop 2025).`
};

export const limitations = {
	flood:
		'Low-lying areas come from a 30 m surface model that includes buildings and trees; they show where water tends to collect, not a flood forecast. Surface water is what satellites saw from 1984 to 2021.',
	'heat-air':
		'Heat maps show surface temperature from Landsat at about 10:30 on clear dry-season days, at 100 m detail — the ground and roofs, not the air you feel. Air quality is a model forecast (Copernicus CAMS), not a measurement.',
	services:
		'Facilities come from OpenStreetMap, which volunteers keep up to date; anything not mapped is not counted. Water points are mapped so incompletely outside Accra that we show them on the map only. Distances are straight lines, not travel routes.',
	environment:
		'Built-up area is a satellite estimate (GHSL); 2030 is a projection. Land cover is from 2021 at 10 m.'
} as const;
