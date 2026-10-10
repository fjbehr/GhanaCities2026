import { describe, expect, it } from 'vitest';
import { cities } from '../../src/lib/config/cities.ts';
import {
	copernicusDemTile,
	ghslTiles,
	gridCells,
	gridCellsFor,
	surfaceWaterTile,
	worldCoverTile
} from './tiles.ts';

const accra = cities.find((c) => c.slug === 'accra')!.bbox;

describe('gridCells', () => {
	it('splits a bbox that crosses the prime meridian', () => {
		expect(gridCells(accra, 1)).toEqual([
			[-1, 5],
			[0, 5]
		]);
	});

	it('does not add a cell for a bbox edge lying exactly on a grid line', () => {
		expect(gridCells([-1.5, 4.5, -1, 5], 1)).toEqual([[-2, 4]]);
	});

	it('deduplicates cells shared by several cities', () => {
		const all = gridCellsFor(
			cities.map((c) => c.bbox),
			10
		);
		expect(all).toEqual([
			[-10, 0],
			[0, 0]
		]);
	});
});

describe('tile names', () => {
	it('names Copernicus DEM tiles', () => {
		expect(copernicusDemTile([-1, 5])).toBe('Copernicus_DSM_COG_10_N05_00_W001_00_DEM');
		expect(copernicusDemTile([0, 5])).toBe('Copernicus_DSM_COG_10_N05_00_E000_00_DEM');
	});

	it('names ESA WorldCover tiles', () => {
		expect(worldCoverTile([-3, 3])).toBe('ESA_WorldCover_10m_2021_v200_N03W003_Map');
		expect(worldCoverTile([0, 3])).toBe('ESA_WorldCover_10m_2021_v200_N03E000_Map');
	});

	it('names JRC surface water tiles by west and north edge', () => {
		expect(surfaceWaterTile([-10, 0])).toBe('10W_10N');
		expect(surfaceWaterTile([0, 0])).toBe('0E_10N');
	});

	it('finds GHSL tiles on their offset grid', () => {
		expect(ghslTiles(cities.find((c) => c.slug === 'tamale')!.bbox)).toEqual(['R8_C18']);
		expect(ghslTiles(accra)).toEqual(['R9_C18', 'R9_C19']);
		// R9 ends at 9.0996 N, so a box across that line needs both rows
		expect(ghslTiles([-1, 9, -0.5, 9.2])).toEqual(['R8_C18', 'R9_C18']);
	});
});
