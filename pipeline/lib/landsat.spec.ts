import { describe, expect, it } from 'vitest';
import { gridFor, isClear, median, toCelsius, utmCoordinates } from './landsat.ts';

describe('Landsat helpers', () => {
	it('converts surface temperature DN to °C', () => {
		// 44 000 × 0.00341802 + 149 − 273.15 ≈ 26.24 °C
		expect(toCelsius(44000)).toBeCloseTo(26.24, 2);
	});

	it('accepts only clear QA pixels', () => {
		expect(isClear(0b0100_0000)).toBe(true); // bit 6: clear
		expect(isClear(0b1000_0000)).toBe(true); // bit 7: water is fine
		expect(isClear(0b0000_1000)).toBe(false); // cloud
		expect(isClear(0b0001_0000)).toBe(false); // cloud shadow
		expect(isClear(0b0000_0010)).toBe(false); // dilated cloud
		expect(isClear(0b0000_0001)).toBe(false); // fill
	});

	it('takes the median of valid values and requires a minimum count', () => {
		expect(median([3, NaN, 1, 2])).toBe(2);
		expect(median([4, 1, 3, 2])).toBe(2.5);
		expect(median([NaN, 5], 2)).toBeNaN();
		expect(median([])).toBeNaN();
	});

	it('snaps a grid outward to multiples of its resolution', () => {
		const g = gridFor([-0.4501, 5.5, 0.1, 5.8502], 0.0005);
		expect(g.originX).toBeCloseTo(-0.4505, 9);
		expect(g.originY).toBeCloseTo(5.8505, 9);
		expect(g.width).toBe(1101);
		expect(g.height).toBe(701);
	});

	it('projects grid centres to UTM zone 30N like PostGIS', () => {
		// Cells centred on (3° W, 5° N) and Accra (0.187° W, 5.603° N); reference: ST_Transform
		const cell = (lon: number, lat: number) =>
			utmCoordinates(
				{
					originX: lon - 0.0005,
					originY: lat + 0.0005,
					resX: 0.001,
					resY: 0.001,
					width: 1,
					height: 1
				},
				32630
			);
		const a = cell(-3, 5);
		expect(a.e[0]).toBeCloseTo(500000, 0);
		expect(a.n[0]).toBeCloseTo(552664.3, 0);
		const b = cell(-0.187, 5.603);
		expect(b.e[0]).toBeCloseTo(811654.6, 0);
		expect(b.n[0]).toBeCloseTo(620067.0, 0);
	});
});
