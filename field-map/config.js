/**
 * Ghana Field Map – Masterportal global configuration (config.js).
 *
 * namedProjections: coordinate reference systems offered in "Coordinates" (coordToolkit).
 * The map itself is drawn in EPSG:3857. Definitions are proj4 strings from the EPSG
 * registry (epsg.io); the "+title=" part is the name shown to users. Ghana first, then
 * WGS 84 UTM zones and national systems used elsewhere in Africa. To add a system, copy its
 * proj4 string from https://epsg.io/<code>.proj4 and add a line.
 */
const Config = {
	namedProjections: [
		// World / web
		[
			'EPSG:4326',
			'+title=GPS coordinates in degrees, minutes, seconds (WGS 84, EPSG:4326) +proj=longlat +datum=WGS84 +no_defs'
		],
		[
			'EPSG:3857',
			'+title=Web map (WGS 84 / Pseudo-Mercator, EPSG:3857) +proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs'
		],

		// Ghana
		[
			'EPSG:2136',
			'+title=Ghana National Grid (Accra, feet, EPSG:2136) +proj=tmerc +lat_0=4.66666666666667 +lon_0=-1 +k=0.99975 +x_0=274319.739163358 +y_0=0 +a=6378300 +rf=296 +towgs84=-199,32,322,0,0,0,0 +to_meter=0.304799710181509 +no_defs'
		],
		[
			'EPSG:25000',
			'+title=Ghana Metre Grid (Leigon, EPSG:25000) +proj=tmerc +lat_0=4.66666666666667 +lon_0=-1 +k=0.99975 +x_0=274319.51 +y_0=0 +a=6378249.145 +rf=293.465 +towgs84=-130,29,364,0,0,0,0 +units=m +no_defs'
		],
		[
			'EPSG:2137',
			'+title=Ghana TM 1 NW (Accra, metres, EPSG:2137) +proj=tmerc +lat_0=0 +lon_0=-1 +k=0.9996 +x_0=500000 +y_0=0 +a=6378300 +rf=296 +towgs84=-199,32,322,0,0,0,0 +units=m +no_defs'
		],
		[
			'EPSG:4168',
			'+title=Accra datum, latitude/longitude (EPSG:4168) +proj=longlat +a=6378300 +rf=296 +towgs84=-199,32,322,0,0,0,0 +no_defs'
		],
		[
			'EPSG:32630',
			'+title=UTM zone 30N (WGS 84) – most of Ghana (EPSG:32630) +proj=utm +zone=30 +datum=WGS84 +units=m +no_defs'
		],
		[
			'EPSG:32631',
			'+title=UTM zone 31N (WGS 84) – eastern Ghana, Togo, Benin (EPSG:32631) +proj=utm +zone=31 +datum=WGS84 +units=m +no_defs'
		],

		// WGS 84 / UTM zones across Africa
		[
			'EPSG:32628',
			'+title=UTM zone 28N (WGS 84) – Senegal, Gambia, Guinea-Bissau (EPSG:32628) +proj=utm +zone=28 +datum=WGS84 +units=m +no_defs'
		],
		[
			'EPSG:32629',
			'+title=UTM zone 29N (WGS 84) – Côte d’Ivoire, Liberia, Sierra Leone, Mali (EPSG:32629) +proj=utm +zone=29 +datum=WGS84 +units=m +no_defs'
		],
		[
			'EPSG:32632',
			'+title=UTM zone 32N (WGS 84) – Nigeria, Niger, Cameroon (EPSG:32632) +proj=utm +zone=32 +datum=WGS84 +units=m +no_defs'
		],
		[
			'EPSG:32633',
			'+title=UTM zone 33N (WGS 84) – Chad, Cameroon, Libya (EPSG:32633) +proj=utm +zone=33 +datum=WGS84 +units=m +no_defs'
		],
		[
			'EPSG:32634',
			'+title=UTM zone 34N (WGS 84) – Central African Republic, Sudan (EPSG:32634) +proj=utm +zone=34 +datum=WGS84 +units=m +no_defs'
		],
		[
			'EPSG:32635',
			'+title=UTM zone 35N (WGS 84) – Sudan, South Sudan, Egypt (EPSG:32635) +proj=utm +zone=35 +datum=WGS84 +units=m +no_defs'
		],
		[
			'EPSG:32636',
			'+title=UTM zone 36N (WGS 84) – Uganda, Ethiopia, Egypt (EPSG:32636) +proj=utm +zone=36 +datum=WGS84 +units=m +no_defs'
		],
		[
			'EPSG:32637',
			'+title=UTM zone 37N (WGS 84) – Kenya, Ethiopia (EPSG:32637) +proj=utm +zone=37 +datum=WGS84 +units=m +no_defs'
		],
		[
			'EPSG:32638',
			'+title=UTM zone 38N (WGS 84) – Somalia, Djibouti (EPSG:32638) +proj=utm +zone=38 +datum=WGS84 +units=m +no_defs'
		],
		[
			'EPSG:32733',
			'+title=UTM zone 33S (WGS 84) – Angola, Namibia, Congo (EPSG:32733) +proj=utm +zone=33 +south +datum=WGS84 +units=m +no_defs'
		],
		[
			'EPSG:32734',
			'+title=UTM zone 34S (WGS 84) – Namibia, Botswana, South Africa (EPSG:32734) +proj=utm +zone=34 +south +datum=WGS84 +units=m +no_defs'
		],
		[
			'EPSG:32735',
			'+title=UTM zone 35S (WGS 84) – Zambia, Zimbabwe, South Africa (EPSG:32735) +proj=utm +zone=35 +south +datum=WGS84 +units=m +no_defs'
		],
		[
			'EPSG:32736',
			'+title=UTM zone 36S (WGS 84) – Tanzania, Malawi, Mozambique (EPSG:32736) +proj=utm +zone=36 +south +datum=WGS84 +units=m +no_defs'
		],

		// National systems elsewhere in Africa
		[
			'EPSG:26391',
			'+title=Nigeria West Belt (Minna, EPSG:26391) +proj=tmerc +lat_0=4 +lon_0=4.5 +k=0.99975 +x_0=230738.26 +y_0=0 +a=6378249.145 +rf=293.465 +towgs84=-92,-93,122,0,0,0,0 +units=m +no_defs'
		],
		[
			'EPSG:26392',
			'+title=Nigeria Mid Belt (Minna, EPSG:26392) +proj=tmerc +lat_0=4 +lon_0=8.5 +k=0.99975 +x_0=670553.98 +y_0=0 +a=6378249.145 +rf=293.465 +towgs84=-92,-93,122,0,0,0,0 +units=m +no_defs'
		],
		[
			'EPSG:26393',
			'+title=Nigeria East Belt (Minna, EPSG:26393) +proj=tmerc +lat_0=4 +lon_0=12.5 +k=0.99975 +x_0=1110369.7 +y_0=0 +a=6378249.145 +rf=293.465 +towgs84=-92,-93,122,0,0,0,0 +units=m +no_defs'
		],
		[
			'EPSG:2043',
			'+title=Côte d’Ivoire (Abidjan 1987 / UTM 29N, EPSG:2043) +proj=utm +zone=29 +a=6378249.145 +rf=293.465 +towgs84=-124.76,53,466.79,0,0,0,0 +units=m +no_defs'
		],
		[
			'EPSG:31028',
			'+title=Senegal (Yoff / UTM 28N, EPSG:31028) +proj=utm +zone=28 +ellps=clrk80ign +towgs84=-30,190,89,0,0,0,0 +units=m +no_defs'
		],
		[
			'EPSG:21097',
			'+title=Kenya north (Arc 1960 / UTM 37N, EPSG:21097) +proj=utm +zone=37 +a=6378249.145 +rf=293.465 +towgs84=-160,-6,-302,0,0,0,0 +units=m +no_defs'
		],
		[
			'EPSG:21037',
			'+title=Kenya, Tanzania (Arc 1960 / UTM 37S, EPSG:21037) +proj=utm +zone=37 +south +a=6378249.145 +rf=293.465 +towgs84=-160,-6,-302,0,0,0,0 +units=m +no_defs'
		],
		[
			'EPSG:4148',
			'+title=South Africa (Hartebeesthoek94, latitude/longitude, EPSG:4148) +proj=longlat +ellps=WGS84 +no_defs'
		]
	],
	layerConf: './resources/services.json',
	restConf: './resources/rest-services.json',
	styleConf: './resources/style_v3.json',
	wfsImgPath: './resources/img/',
	portalLanguage: {
		enabled: false,
		debug: false,
		languages: { en: 'English' },
		fallbackLanguage: 'en',
		changeLanguageOnStartWhen: ['querystring']
	},
	portalLocales: {
		en: {
			common: {
				modules: {
					searchBar: {
						placeholder: {
							address: 'Search for a village, town or place'
						}
					}
				}
			}
		}
	}
};

if (typeof module !== 'undefined') {
	module.exports = Config;
}
