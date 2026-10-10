const Config = {
	namedProjections: [
		[
			'EPSG:3857',
			'+title=WGS 84 / Pseudo-Mercator +proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs'
		],
		['EPSG:4326', '+title=WGS 84 +proj=longlat +datum=WGS84 +no_defs']
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
	}
};

if (typeof module !== 'undefined') {
	module.exports = Config;
}
