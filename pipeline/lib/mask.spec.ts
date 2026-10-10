import { describe, expect, it } from 'vitest';
import { applyMask, polygonMask, rings } from './mask.ts';
import type { Clip } from './raster.ts';

// 6×6 grid of 1° cells, top-left at (0, 6)
const grid = { width: 6, height: 6, originX: 0, originY: 6, resX: 1, resY: 1 };
const square = (x0: number, y0: number, x1: number, y1: number) => [
	[x0, y0],
	[x1, y0],
	[x1, y1],
	[x0, y1],
	[x0, y0]
];
const rows = (m: Uint8Array) =>
	Array.from({ length: 6 }, (_, r) => [...m.subarray(r * 6, r * 6 + 6)].join(''));

describe('polygonMask', () => {
	it('fills cells whose centre is inside, leaving holes empty', () => {
		const outer = square(1, 1, 5, 5);
		const hole = square(2, 2, 4, 4);
		expect(rows(polygonMask(grid, rings({ type: 'Polygon', coordinates: [outer, hole] })))).toEqual(
			['000000', '011110', '010010', '010010', '011110', '000000']
		);
	});

	it('handles several polygons', () => {
		const m = polygonMask(
			grid,
			rings({ type: 'MultiPolygon', coordinates: [[square(0, 5, 1, 6)], [square(5, 0, 6, 1)]] })
		);
		expect(rows(m)).toEqual(['100000', '000000', '000000', '000000', '000000', '000001']);
	});
});

describe('applyMask', () => {
	it('sets cells outside to nodata, using the fallback when none is declared', () => {
		const c: Clip = { ...grid, width: 3, height: 1, data: Uint8Array.of(7, 0, 9), nodata: null };
		const out = applyMask(c, Uint8Array.of(1, 1, 0), 255);
		expect([...out.data]).toEqual([7, 0, 255]);
		expect(out.nodata).toBe(255);
		expect(applyMask({ ...c, nodata: 5 }, Uint8Array.of(0, 1, 1), 255).data[0]).toBe(5);
	});
});
