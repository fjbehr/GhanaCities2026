/** Masterportal config.json for the portal "ghana" */
import { LAYER } from '../src/lib/config/map.ts';

/** EPSG:4326 → EPSG:3857 */
export function toMercator([lon, lat]: [number, number]): [number, number] {
	const r = 6378137;
	return [(r * lon * Math.PI) / 180, r * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))];
}

// Ghana plus a margin; the map cannot be panned outside it
const GHANA_EXTENT = [...toMercator([-3.8, 4.3]), ...toMercator([1.8, 11.6])];

/** Web-Mercator zoom levels 6 (country) to 19 (street), at 96 dpi */
const ZOOM_LEVELS = Array.from({ length: 14 }, (_, i) => {
	const z = i + 6;
	const resolution = 156543.03392804097 / 2 ** z;
	return { resolution, scale: Math.round(resolution / 0.00026458333), zoomLevel: i };
});

/** Vector layers need the id of their rule set in style_v3.json */
const STYLE_IDS: Record<string, string> = { [LAYER.fires]: 'fires' };

const folder = (name: string, ids: string[]) => ({
	name,
	type: 'folder',
	elements: ids.map((id) => ({
		id,
		visibility: false,
		...(STYLE_IDS[id] && { styleId: STYLE_IDS[id] })
	}))
});

/** Masterportal style_v3.json: rules for vector (GeoJSON) layers */
export function vectorStyles() {
	return [
		{
			styleId: 'fires',
			rules: [
				{
					conditions: { properties: { confidence: 'high' } },
					style: {
						type: 'circle',
						circleRadius: 7,
						circleFillColor: [194, 65, 12, 0.95],
						circleStrokeColor: [255, 255, 255, 1],
						circleStrokeWidth: 1.5,
						legendValue: 'Active fire, high confidence'
					}
				},
				{
					style: {
						type: 'circle',
						circleRadius: 5,
						circleFillColor: [249, 115, 22, 0.85],
						circleStrokeColor: [255, 255, 255, 1],
						circleStrokeWidth: 1.5,
						legendValue: 'Active fire'
					}
				}
			]
		}
	];
}

export function portalConfig() {
	return {
		portalConfig: {
			map: {
				controls: {
					zoom: true,
					orientation: { zoomMode: 'once' },
					fullScreen: true
				},
				mapView: {
					epsg: 'EPSG:3857',
					startCenter: toMercator([-1.05, 7.9]),
					extent: GHANA_EXTENT,
					options: ZOOM_LEVELS,
					startZoomLevel: 1
				},
				mouseHover: { numFeaturesToShow: 1 }
			},
			mainMenu: {
				expanded: false,
				title: { text: 'Ghana Cities', link: '/', toolTip: 'Back to Ghana Cities' },
				searchBar: { searchInterfaces: [{ type: 'topicTree', hitTemplate: 'layer' }] },
				sections: [[{ type: 'shareView' }]]
			},
			secondaryMenu: {
				expanded: false,
				sections: [[{ type: 'legend' }, { type: 'measure' }]]
			},
			tree: { singleBaselayer: true },
			portalFooter: {
				scaleLine: true,
				urls: [
					{
						bezeichnung: '© ',
						url: 'https://www.openstreetmap.org/copyright',
						alias: 'OpenStreetMap contributors, Protomaps',
						alias_mobile: 'OpenStreetMap'
					},
					{
						bezeichnung: 'Data: ',
						url: '/data',
						alias: 'sources, licences and methods',
						alias_mobile: 'Sources'
					}
				]
			}
		},
		layerConfig: {
			baselayer: {
				elements: [
					{ id: LAYER.basemap, visibility: true },
					{ id: LAYER.satellite, visibility: false }
				]
			},
			subjectlayer: {
				elements: [
					folder('Flood & Rain', [LAYER.lowLying, LAYER.surfaceWater]),
					folder('Heat & Air', [LAYER.heat, LAYER.surfaceTemperature]),
					folder('Services & Access', [
						LAYER.accessHealth,
						LAYER.poiHealth,
						LAYER.poiSchool,
						LAYER.poiMarket,
						LAYER.poiWater,
						LAYER.population
					]),
					folder('Environment & Land Use', [
						LAYER.landCover,
						LAYER.builtUp,
						LAYER.fires,
						LAYER.nightLights
					]),
					folder('Boundaries', [LAYER.districts, LAYER.studyArea])
				]
			}
		}
	};
}
