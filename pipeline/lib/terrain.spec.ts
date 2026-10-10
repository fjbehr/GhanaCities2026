import { describe, expect, it } from 'vitest';
import type { Clip } from './raster.ts';
import { LOW_LYING, lowLying, NO_DATA, NOT_LOW_LYING } from './terrain.ts';

const grid = (rows: number[][], nodata = -9999): Clip => ({
	data: Float32Array.from(rows.flat()),
	width: rows[0].length,
	height: rows.length,
	originX: 0,
	originY: 0,
	resX: 1,
	resY: 1,
	nodata
});

describe('lowLying', () => {
	it('flags a valley bottom but not the slopes or a flat plain', () => {
		const dem = grid([
			[20, 20, 10, 20, 20],
			[20, 20, 10, 20, 20],
			[20, 20, 10, 20, 20]
		]);
		const out = lowLying(dem, 1, 3);
		expect([...out.data]).toEqual([0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0]);
		expect(lowLying(grid([[5, 5, 5]]), 1, 1).data.every((v) => v === NOT_LOW_LYING)).toBe(true);
	});

	it('keeps nodata cells out of the neighbourhood mean', () => {
		const dem = grid([[-9999, 10, 10, 4]]);
		const out = lowLying(dem, 1, 3);
		expect([...out.data]).toEqual([NO_DATA, NOT_LOW_LYING, NOT_LOW_LYING, LOW_LYING]);
		expect(out.nodata).toBe(NO_DATA);
	});
});
