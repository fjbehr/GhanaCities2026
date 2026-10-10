import { describe, expect, it } from 'vitest';
import { getCity } from './cities.ts';
import { LAYER, portalUrl, topicLayers } from './map.ts';
import { topics } from './topics.ts';

const params = (url: string) => new URL(url, 'http://site').searchParams;

describe('portalUrl', () => {
	it('opens a city extent with the basemap and the topic layers', () => {
		const p = params(portalUrl(getCity('tamale'), 'flood'));
		expect(JSON.parse(p.get('LAYERS')!)).toEqual([
			{ id: 'basemap', visibility: true },
			{ id: 'lowlying', visibility: true },
			{ id: 'surfacewater', visibility: true },
			{ id: 'districts', visibility: true }
		]);
		expect(p.get('PROJECTION')).toBe('EPSG:4326');
		expect(p.get('ZOOMTOEXTENT')).toBe('-0.95,9.33,-0.75,9.5');
	});

	it('opens the whole portal without a city', () => {
		const p = params(portalUrl());
		expect(p.has('ZOOMTOEXTENT')).toBe(false);
		expect(JSON.parse(p.get('LAYERS')!)).toEqual([{ id: 'basemap', visibility: true }]);
	});
});

describe('layer ids', () => {
	it('gives every topic at least one layer and uses ids without underscores', () => {
		for (const t of topics) expect(topicLayers[t.slug].length).toBeGreaterThan(0);
		for (const id of Object.values(LAYER)) expect(id).toMatch(/^[a-z]+$/);
	});
});
