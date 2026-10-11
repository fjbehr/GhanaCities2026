import { describe, expect, it } from 'vitest';
import { airLevel, heatLevel, rainLevel, riverLevel, worst } from './levels.ts';

describe('rainLevel', () => {
	it('bands the 24-hour total', () => {
		expect(rainLevel(4, 2).level).toBe('calm');
		expect(rainLevel(10, 4).level).toBe('watch');
		expect(rainLevel(30, 6).level).toBe('act');
		expect(rainLevel(55, 10)).toMatchObject({ level: 'severe', label: 'Very heavy rain likely' });
	});

	it('treats a single intense hour as heavy rain', () => {
		expect(rainLevel(22, 21).level).toBe('act');
	});
});

describe('heatLevel', () => {
	it('treats ordinary Ghanaian heat as calm and starts at the danger band', () => {
		expect(heatLevel(37).level).toBe('calm');
		expect(heatLevel(39)).toMatchObject({ level: 'watch', label: 'Very hot' });
		expect(heatLevel(45).level).toBe('act');
		expect(heatLevel(51).level).toBe('severe');
	});
});

describe('airLevel', () => {
	it('lets the worse of PM2.5 and PM10 decide', () => {
		expect(airLevel(6, 20).level).toBe('calm');
		expect(airLevel(12, 20).level).toBe('watch');
		expect(airLevel(8, 160).level).toBe('act');
		expect(airLevel(60, 40).level).toBe('severe');
	});

	it('leads with the scale word and names Harmattan dust when dust dominates', () => {
		expect(airLevel(30, 300, 0.8).label).toBe('Air quality: unhealthy (Harmattan dust)');
		expect(airLevel(30, 300, 0.1).label).toBe('Air quality: unhealthy');
		expect(airLevel(12, 20, 0.7).label).toBe('Air quality: moderate (Saharan dust)');
		expect(airLevel(5, 10).label).toBe('Air quality: good');
	});
});

describe('riverLevel and worst', () => {
	it('compares with the river’s own percentiles', () => {
		expect(riverLevel(5, 37, 62).level).toBe('calm');
		expect(riverLevel(40, 37, 62).level).toBe('watch');
		expect(riverLevel(70, 37, 62).level).toBe('act');
	});

	it('picks the most severe level', () => {
		expect(worst(['calm', 'act', 'watch'])).toBe('act');
		expect(worst([])).toBe('calm');
	});
});
