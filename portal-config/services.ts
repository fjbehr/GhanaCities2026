/**
 * Masterportal services.json: every layer the portal can show. Masterportal needs absolute
 * service URLs, so the site serves this per request with its own origin (see the route
 * portal/ghana/resources/services.json).
 */
import { LAYER } from '../src/lib/config/map.ts';

/** Web-Mercator resolutions for 512 px vector tiles, zoom 0–15 (the extract's max zoom) */
const VECTOR_TILE_RESOLUTIONS = Array.from({ length: 16 }, (_, z) => 78271.51696402048 / 2 ** z);

const districtAttributes = {
	name: 'District',
	region: 'Region',
	population: 'Residents (2025)',
	health_2km_pct: 'Residents within 2 km of a health facility (%)',
	health_5km_pct: 'Residents within 5 km of a health facility (%)',
	school_2km_pct: 'Residents within 2 km of a school (%)',
	market_2km_pct: 'Residents within 2 km of a market (%)',
	surface_temp_c: 'Surface temperature, dry-season day (°C)',
	heat_vs_city_c: 'Hotter (+) or cooler (−) than the city average (°C)',
	pop_low_lying_pct: 'Residents in low-lying areas (%)',
	surface_water_pct: 'Area often under water (%)',
	built_cover_pct: 'Built-up land cover (%)',
	tree_cover_pct: 'Tree cover (%)',
	built_up_1975_km2: 'Built-up area 1975 (km²)',
	built_up_2020_km2: 'Built-up area 2020 (km²)'
};

const poiAttributes = { name: 'Name', kind: 'Type', osm_ref: 'OpenStreetMap id' };

function wms(
	origin: string,
	id: string,
	name: string,
	layers: string,
	attribution: string,
	extra: Record<string, unknown> = {}
) {
	return {
		id,
		name,
		typ: 'WMS',
		url: `${origin}/geoserver/ghana/wms`,
		layers,
		format: 'image/png',
		version: '1.3.0',
		transparent: true,
		singleTile: false,
		tilesize: '512',
		gutter: '0',
		infoFormat: 'application/vnd.ogc.gml',
		gfiAttributes: 'ignore',
		gfiTheme: 'default',
		featureCount: '3',
		layerAttribution: attribution,
		legendURL: '',
		datasets: [],
		...extra
	};
}

/** WMTS on the GoogleMapsCompatible grid, configured explicitly to avoid loading large capabilities */
function googleWmts(o: {
	id: string;
	name: string;
	url: string;
	layer: string;
	tileMatrixSet: string;
	format: string;
	maxLevel: number;
	attribution: string;
	transparent: boolean;
	legendURL?: string;
	transparency?: number;
}) {
	const levels = Array.from({ length: o.maxLevel + 1 }, (_, z) => z);
	return {
		id: o.id,
		name: o.name,
		typ: 'WMTS',
		urls: [o.url],
		layer: o.layer,
		version: '1.0.0',
		format: o.format,
		style: 'default',
		transparent: o.transparent,
		tileSize: '256',
		tileMatrixSet: o.tileMatrixSet,
		matrixSizes: levels.map((z) => [2 ** z, 2 ** z]),
		coordinateSystem: 'EPSG:3857',
		origin: [-20037508.3428, 20037508.3428],
		scales: levels.map((z) => 559082264.029 / 2 ** z),
		resLength: String(levels.length),
		requestEncoding: 'REST',
		wrapX: true,
		layerAttribution: o.attribution,
		legend: Boolean(o.legendURL),
		legendURL: o.legendURL ?? '',
		transparency: o.transparency ?? 0,
		gfiAttributes: 'ignore',
		// Without an explicit range Masterportal hides the layer beyond its last tile level;
		// OpenLayers then simply enlarges the coarsest tiles
		minScale: '0',
		maxScale: '100000000'
	};
}

export function services(origin: string) {
	const list = [
		{
			id: LAYER.basemap,
			name: 'Map (OpenStreetMap)',
			typ: 'VectorTile',
			epsg: 'EPSG:3857',
			url: `${origin}/basemap/ghana/{z}/{x}/{y}.mvt`,
			resolutions: VECTOR_TILE_RESOLUTIONS,
			vtStyles: [
				{ id: 'light', name: 'Light', url: './resources/basemap-style.json', defaultStyle: true }
			],
			gfiAttributes: 'ignore',
			layerAttribution:
				'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://protomaps.com">Protomaps</a>'
		},
		googleWmts({
			id: LAYER.satellite,
			name: 'Satellite image (Sentinel-2 cloudless 2024)',
			url: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/g/{TileMatrix}/{TileRow}/{TileCol}.jpg',
			layer: 's2cloudless-2024_3857',
			tileMatrixSet: 'g',
			format: 'image/jpeg',
			maxLevel: 15,
			transparent: false,
			attribution:
				'<a href="https://s2maps.eu">Sentinel-2 cloudless 2024</a> by EOX IT Services GmbH (contains modified Copernicus Sentinel data 2024), CC BY-NC-SA 4.0'
		}),

		wms(
			origin,
			LAYER.lowLying,
			'Low-lying areas',
			'ghana:low_lying',
			'Derived from Copernicus DEM GLO-30'
		),
		wms(
			origin,
			LAYER.surfaceWater,
			'Surface water 1984–2021',
			'ghana:surface_water',
			'EC JRC / Google, Global Surface Water',
			{ gfiAttributes: { GRAY_INDEX: 'Share of observations with water (%)' } }
		),
		wms(origin, LAYER.population, 'Population 2025', 'ghana:population', 'WorldPop (CC BY 4.0)', {
			gfiAttributes: { GRAY_INDEX: 'Residents in this 100 m cell' }
		}),

		wms(
			origin,
			LAYER.accessHealth,
			'Access to health facilities by district',
			'ghana:district',
			'geoBoundaries, WorldPop, © OpenStreetMap contributors',
			{ gfiAttributes: districtAttributes, singleTile: true }
		),
		wms(
			origin,
			LAYER.poiHealth,
			'Health facilities',
			'ghana:poi_health',
			'© OpenStreetMap contributors',
			{
				gfiAttributes: poiAttributes
			}
		),
		wms(origin, LAYER.poiSchool, 'Schools', 'ghana:poi_school', '© OpenStreetMap contributors', {
			gfiAttributes: poiAttributes
		}),
		wms(origin, LAYER.poiMarket, 'Markets', 'ghana:poi_market', '© OpenStreetMap contributors', {
			gfiAttributes: poiAttributes
		}),
		wms(
			origin,
			LAYER.poiWater,
			'Water points (incomplete)',
			'ghana:poi_water',
			'© OpenStreetMap contributors — water points are mapped very incompletely outside Accra',
			{ gfiAttributes: poiAttributes }
		),

		wms(
			origin,
			LAYER.landCover,
			'Land cover 2021',
			'ghana:landcover',
			'ESA WorldCover 2021 (CC BY 4.0)'
		),
		wms(
			origin,
			LAYER.builtUp,
			'Built-up area 1975–2030',
			'ghana:built',
			'GHSL, European Commission JRC (CC BY 4.0)',
			{
				time: true
			}
		),
		wms(
			origin,
			LAYER.heat,
			'Hotter or cooler than the city average (Landsat, dry season)',
			'ghana:heat',
			'Landsat 8/9 courtesy of the U.S. Geological Survey, via Microsoft Planetary Computer',
			{ gfiAttributes: { GRAY_INDEX: 'Difference from the city average (°C)' } }
		),
		googleWmts({
			id: LAYER.surfaceTemperature,
			// Fixed dry-season composite: in the rainy season clouds leave the latest one mostly empty
			name: 'Land surface temperature, regional overview (MODIS, 10–17 Feb 2026)',
			url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_L3_Land_Surface_Temp_8Day_Day/default/2026-02-10/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png',
			layer: 'MODIS_Terra_L3_Land_Surface_Temp_8Day_Day',
			tileMatrixSet: 'GoogleMapsCompatible_Level7',
			format: 'image/png',
			maxLevel: 7,
			transparent: true,
			attribution: 'NASA EOSDIS GIBS, MODIS Terra',
			legendURL: 'https://gibs.earthdata.nasa.gov/legends/MODIS_Land_Surface_Temp_H.svg',
			// 1 km cells under a global colour scale: keep the city readable underneath
			transparency: 40
		}),
		googleWmts({
			id: LAYER.nightLights,
			name: 'Night lights 2016 (VIIRS Black Marble)',
			url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/default/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png',
			layer: 'VIIRS_Black_Marble',
			tileMatrixSet: 'GoogleMapsCompatible_Level8',
			format: 'image/png',
			maxLevel: 8,
			transparent: false,
			attribution: 'NASA Earth Observatory, NASA EOSDIS GIBS'
		}),

		{
			id: LAYER.fires,
			name: 'Active fires, last 48 hours (NASA FIRMS)',
			typ: 'GeoJSON',
			url: `${origin}/api/layers/fires.geojson`,
			gfiAttributes: {
				date: 'Date',
				time: 'Time',
				daynight: 'Day or night',
				confidence: 'Detection confidence',
				frp: 'Fire radiative power (MW)'
			},
			gfiTheme: 'default',
			legend: true,
			layerAttribution: 'NASA FIRMS (VIIRS S-NPP)'
		},
		wms(
			origin,
			LAYER.districts,
			'District boundaries',
			'ghana:district_boundaries',
			'geoBoundaries (CC BY 4.0)',
			{ gfiAttributes: districtAttributes, singleTile: true }
		),
		wms(origin, LAYER.studyArea, 'Study areas', 'ghana:study_area', 'Ghana Cities')
	];
	// Masterportal opens a window for every visible layer with an attribution, covering the map
	// on phones. Sources are credited in the footer and on /data instead; only the satellite
	// image keeps its notice, as its licence requires a visible credit while it is shown.
	return list.map((s) =>
		s.id === LAYER.satellite ? s : { ...s, layerAttribution: 'nicht vorhanden' }
	);
}
