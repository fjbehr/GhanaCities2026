import type { City } from './cities.ts';
import type { TopicSlug } from './topics.ts';

/** Masterportal layer ids (services.json); no underscores, Masterportal modules trip over them */
export const LAYER = {
	basemap: 'basemap',
	satellite: 'satellite',
	studyArea: 'studyarea',
	districts: 'districts',
	lowLying: 'lowlying',
	surfaceWater: 'surfacewater',
	population: 'population',
	accessHealth: 'accesshealth',
	poiHealth: 'poihealth',
	poiSchool: 'poischool',
	poiMarket: 'poimarket',
	poiWater: 'poiwater',
	landCover: 'landcover',
	builtUp: 'builtup',
	heat: 'heat',
	surfaceTemperature: 'lstday',
	nightLights: 'nightlights',
	fires: 'fires'
} as const;

/** Layers switched on when a topic's map opens */
export const topicLayers: Record<TopicSlug, string[]> = {
	flood: [LAYER.lowLying, LAYER.surfaceWater, LAYER.districts],
	'heat-air': [LAYER.heat, LAYER.districts],
	services: [LAYER.accessHealth, LAYER.poiHealth, LAYER.poiSchool, LAYER.poiMarket],
	environment: [LAYER.landCover, LAYER.districts]
};

// Explicit index.html: the Vite dev server does not serve directory indexes from static/
export const PORTAL_PATH = '/portal/ghana/index.html';

/** Masterportal URL opening a city's extent with a topic's layers (or the basemap only) */
export function portalUrl(city?: City, topic?: TopicSlug): string {
	const layers = [LAYER.basemap, ...(topic ? topicLayers[topic] : [])].map((id) => ({
		id,
		visibility: true
	}));
	const params = new URLSearchParams({ LAYERS: JSON.stringify(layers) });
	if (city) {
		params.set('PROJECTION', 'EPSG:4326');
		params.set('ZOOMTOEXTENT', city.bbox.join(','));
	}
	return `${PORTAL_PATH}?${params}`;
}
