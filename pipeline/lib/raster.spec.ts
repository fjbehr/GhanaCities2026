import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { clip, mean, writeTiff, type Clip } from './raster.ts';

// Two adjacent 1°x1° tiles at 0.25° resolution, west tile values 1..16, east tile 101..116
const tile = (originX: number, base: number): Clip => ({
	data: Float32Array.from({ length: 16 }, (_, i) => base + i + 1),
	width: 4,
	height: 4,
	originX,
	originY: 6,
	resX: 0.25,
	resY: 0.25,
	nodata: -9999
});

let dir: string;
let west: string;
let east: string;

beforeAll(async () => {
	dir = await mkdtemp(path.join(tmpdir(), 'clip-'));
	west = path.join(dir, 'west.tif');
	east = path.join(dir, 'east.tif');
	await writeTiff(west, tile(-1, 0));
	await writeTiff(east, tile(0, 100));
});

afterAll(() => rm(dir, { recursive: true, force: true }));

describe('clip', () => {
	it('mosaics a window across the tile border', async () => {
		const c = await clip([west, east], [-0.5, 5.5, 0.5, 6]);
		expect([c.width, c.height, c.originX, c.originY]).toEqual([4, 2, -0.5, 6]);
		expect([...c.data]).toEqual([3, 4, 101, 102, 7, 8, 105, 106]);
	});

	it('snaps outward to whole pixels', async () => {
		const c = await clip([west], [-0.9, 5.1, -0.6, 5.2]);
		expect([c.width, c.height, c.originX, c.originY]).toEqual([2, 1, -1, 5.25]);
		expect([...c.data]).toEqual([13, 14]);
	});

	it('fills cells outside every tile with nodata and skips them in the mean', async () => {
		const c = await clip([west], [-0.5, 5.5, 0.5, 6]);
		expect([...c.data]).toEqual([3, 4, -9999, -9999, 7, 8, -9999, -9999]);
		expect(mean(c)).toBe(5.5);
	});

	it('honours a nodata value the file does not declare', async () => {
		const file = path.join(dir, 'untagged.tif');
		await writeTiff(file, {
			...tile(-1, 0),
			data: Float32Array.of(...Array(15).fill(10), -9999),
			nodata: null
		});
		expect(mean(await clip([file], [-1, 5, 0, 6]))).toBeLessThan(10);
		expect(mean(await clip([file], [-1, 5, 0, 6], { nodata: -9999 }))).toBe(10);
	});

	it('round-trips through writeTiff with georeference and nodata', async () => {
		const file = path.join(dir, 'clip.tif');
		await writeTiff(file, await clip([west, east], [-0.5, 5.5, 0.5, 6]));
		const again = await clip([file], [-0.5, 5.5, 0.5, 6]);
		expect([...again.data]).toEqual([3, 4, 101, 102, 7, 8, 105, 106]);
		expect(again.nodata).toBe(-9999);
	});
});
