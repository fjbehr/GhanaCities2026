/** Legends of the map previews; colours match the SLD styles in geoserver/styles */
import type { TopicSlug } from './topics.ts';

export interface LegendItem {
	label: string;
	kind: 'fill' | 'line' | 'cross' | 'triangle' | 'square';
	color: string;
}

export const legends: Record<TopicSlug, LegendItem[]> = {
	flood: [
		{ label: 'Low-lying: water runs together here', kind: 'fill', color: '#8ea6eb' },
		{ label: 'Often under water', kind: 'fill', color: '#38bdf8' },
		{ label: 'Almost always water', kind: 'fill', color: '#0369a1' },
		{ label: 'District boundary', kind: 'line', color: '#334155' }
	],
	'heat-air': [
		{ label: '4 °C or more hotter than the city average', kind: 'fill', color: '#b2182b' },
		{ label: '2–4 °C hotter', kind: 'fill', color: '#ef8a62' },
		{ label: 'About average', kind: 'fill', color: '#e5e7eb' },
		{ label: '2–4 °C cooler', kind: 'fill', color: '#67a9cf' },
		{ label: '4 °C or more cooler', kind: 'fill', color: '#2166ac' }
	],
	services: [
		{ label: 'Health facility', kind: 'cross', color: '#dc2626' },
		{ label: 'School', kind: 'triangle', color: '#7c3aed' },
		{ label: 'Market', kind: 'square', color: '#b45309' },
		{
			label: 'Districts: darker = more people within 2 km of health care',
			kind: 'fill',
			color: '#2563eb'
		}
	],
	environment: [
		{ label: 'Built-up', kind: 'fill', color: '#5b5f66' },
		{ label: 'Trees', kind: 'fill', color: '#006400' },
		{ label: 'Cropland', kind: 'fill', color: '#f096ff' },
		{ label: 'Grassland', kind: 'fill', color: '#ffff4c' },
		{ label: 'Shrubs', kind: 'fill', color: '#ffbb22' },
		{ label: 'Water', kind: 'fill', color: '#0064c8' }
	]
};
