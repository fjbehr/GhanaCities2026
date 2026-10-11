/** Every dataset the site uses, for the data page */
export interface Source {
	name: string;
	provider: string;
	licence: string;
	licenceUrl: string;
	url: string;
	usedFor: string;
	updated: string;
}

export const sources: Source[] = [
	{
		name: 'Weather forecast',
		provider: 'Open-Meteo (ECMWF, DWD and others)',
		licence: 'CC BY 4.0',
		licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
		url: 'https://open-meteo.com',
		usedFor: 'Rain, temperature, feels-like temperature and UV for the next three days',
		updated: 'Every 30 minutes'
	},
	{
		name: 'Air quality forecast',
		provider: 'Open-Meteo, Copernicus Atmosphere Monitoring Service (CAMS)',
		licence: 'CC BY 4.0',
		licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
		url: 'https://open-meteo.com/en/docs/air-quality-api',
		usedFor: 'Fine dust (PM2.5), coarse dust (PM10) and Saharan dust',
		updated: 'Every hour'
	},
	{
		name: 'River discharge',
		provider: 'Open-Meteo, Copernicus GloFAS',
		licence: 'CC BY 4.0',
		licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
		url: 'https://open-meteo.com/en/docs/flood-api',
		usedFor: 'Densu river above Weija (Accra)',
		updated: 'Every 6 hours'
	},
	{
		name: 'Active fires',
		provider: 'NASA FIRMS (VIIRS S-NPP)',
		licence: 'Free use, NASA data policy',
		licenceUrl: 'https://www.earthdata.nasa.gov/engage/open-data-services-software-policies',
		url: 'https://firms.modaps.eosdis.nasa.gov',
		usedFor: 'Fires detected in Ghana in the last 48 hours (map)',
		updated: 'Every 3 hours'
	},
	{
		name: 'District boundaries (MMDAs)',
		provider: 'geoBoundaries, William & Mary geoLab',
		licence: 'CC BY 4.0',
		licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
		url: 'https://www.geoboundaries.org',
		usedFor: 'Districts and regions (boundaries as of 2019)',
		updated: 'Static'
	},
	{
		name: 'Clinics, schools, markets, water points, streets',
		provider: '© OpenStreetMap contributors (via Geofabrik and Protomaps)',
		licence: 'ODbL 1.0',
		licenceUrl: 'https://www.openstreetmap.org/copyright',
		url: 'https://www.openstreetmap.org',
		usedFor: 'Facilities, distances and the street map',
		updated: 'When the data is rebuilt'
	},
	{
		name: 'Population 2025',
		provider: 'WorldPop, University of Southampton',
		licence: 'CC BY 4.0',
		licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
		url: 'https://www.worldpop.org',
		usedFor: 'Residents per 100 m cell, district population, access figures',
		updated: 'Release R2025A'
	},
	{
		name: 'Terrain (Copernicus DEM GLO-30)',
		provider: 'European Space Agency, Copernicus',
		licence: 'Copernicus DEM licence (free use)',
		licenceUrl: 'https://spacedata.copernicus.eu/collections/copernicus-digital-elevation-model',
		url: 'https://spacedata.copernicus.eu',
		usedFor: 'Low-lying areas',
		updated: 'Static'
	},
	{
		name: 'Surface water 1984–2021',
		provider: 'EC Joint Research Centre / Google, Global Surface Water',
		licence: 'Free use with attribution',
		licenceUrl: 'https://global-surface-water.appspot.com/download',
		url: 'https://global-surface-water.appspot.com',
		usedFor: 'Where water stood and how often',
		updated: 'Version 1.4'
	},
	{
		name: 'Rainfall (CHIRPS and CHPclim)',
		provider: 'Climate Hazards Center, UC Santa Barbara',
		licence: 'Public domain (CC0)',
		licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
		url: 'https://www.chc.ucsb.edu/data/chirps',
		usedFor: 'Monthly rain of the last 12 months against the long-term normal',
		updated: 'Monthly'
	},
	{
		name: 'Surface temperature',
		provider:
			'Landsat 8 and 9, courtesy of the U.S. Geological Survey, via Microsoft Planetary Computer',
		licence: 'Public domain (USGS)',
		licenceUrl: 'https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits',
		url: 'https://planetarycomputer.microsoft.com/dataset/landsat-c2-l2',
		usedFor: 'Hotter and cooler parts of each city in the dry season',
		updated: 'Dry seasons 2024/25 and 2025/26'
	},
	{
		name: 'Land surface temperature (overview) and night lights',
		provider: 'NASA EOSDIS GIBS (MODIS, VIIRS Black Marble)',
		licence: 'Free use, NASA data policy',
		licenceUrl: 'https://www.earthdata.nasa.gov/engage/open-data-services-software-policies',
		url: 'https://www.earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/gibs',
		usedFor: 'Regional overview layers on the map',
		updated: 'Fixed dates, named on the map'
	},
	{
		name: 'Land cover 2021',
		provider: 'ESA WorldCover',
		licence: 'CC BY 4.0',
		licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
		url: 'https://esa-worldcover.org',
		usedFor: 'Trees, built-up land, cropland and other cover',
		updated: 'Version 200'
	},
	{
		name: 'Built-up area 1975–2030',
		provider: 'Global Human Settlement Layer, European Commission JRC',
		licence: 'CC BY 4.0',
		licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
		url: 'https://human-settlement.emergency.copernicus.eu',
		usedFor: 'Growth of the built-up area; 2030 is a projection',
		updated: 'Release R2023A'
	},
	{
		name: 'Satellite image',
		provider: 'Sentinel-2 cloudless 2024 by EOX IT Services (contains Copernicus Sentinel data)',
		licence: 'CC BY-NC-SA 4.0',
		licenceUrl: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
		url: 'https://s2maps.eu',
		usedFor: 'Background image on the map',
		updated: '2024'
	}
];
