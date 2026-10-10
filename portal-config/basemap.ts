/** Mapbox GL style for the self-hosted Protomaps basemap (rendered by ol-mapbox-style) */
import { layers, namedFlavor } from '@protomaps/basemaps';

export function basemapStyle() {
	// Icon layers need a sprite sheet from an external host; labels and shapes do not
	const styleLayers = layers('protomaps', namedFlavor('light'), { lang: 'en' }).filter(
		(l) => !('layout' in l && l.layout && 'icon-image' in l.layout)
	);
	return {
		version: 8,
		name: 'Ghana Cities light',
		sources: {
			protomaps: {
				type: 'vector',
				tiles: ['/basemap/ghana/{z}/{x}/{y}.mvt'],
				maxzoom: 15,
				attribution:
					'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://protomaps.com">Protomaps</a>'
			}
		},
		layers: styleLayers
	};
}
