import type { BBox } from '../../src/lib/config/cities.ts';

/** Lower-left corners [lon, lat] of the `size`-degree grid cells that intersect `bbox`. */
export function gridCells(bbox: BBox, size: number): [number, number][] {
	const [w, s, e, n] = bbox;
	const eps = 1e-9;
	const cells: [number, number][] = [];
	for (let lat = Math.floor(s / size) * size; lat < n - eps; lat += size) {
		for (let lon = Math.floor(w / size) * size; lon < e - eps; lon += size) {
			cells.push([lon, lat]);
		}
	}
	return cells;
}

/** Unique cells over several bboxes */
export function gridCellsFor(bboxes: readonly BBox[], size: number): [number, number][] {
	const seen = new Map<string, [number, number]>();
	for (const bbox of bboxes) for (const c of gridCells(bbox, size)) seen.set(c.join(','), c);
	return [...seen.values()];
}

const ns = (lat: number, digits: number) =>
	(lat < 0 ? 'S' : 'N') + String(Math.abs(lat)).padStart(digits, '0');
const ew = (lon: number, digits: number) =>
	(lon < 0 ? 'W' : 'E') + String(Math.abs(lon)).padStart(digits, '0');

/** Copernicus DEM GLO-30 (1° tiles, named by lower-left corner) */
export function copernicusDemTile([lon, lat]: [number, number]): string {
	return `Copernicus_DSM_COG_10_${ns(lat, 2)}_00_${ew(lon, 3)}_00_DEM`;
}

/** ESA WorldCover 2021 v200 (3° tiles, named by lower-left corner) */
export function worldCoverTile([lon, lat]: [number, number]): string {
	return `ESA_WorldCover_10m_2021_v200_${ns(lat, 2)}${ew(lon, 3)}_Map`;
}

/** JRC Global Surface Water (10° tiles, named by west edge and north edge) */
export function surfaceWaterTile([lon, lat]: [number, number]): string {
	const north = lat + 10;
	const lonLabel = `${Math.abs(lon)}${lon < 0 ? 'W' : 'E'}`;
	const latLabel = `${Math.abs(north)}${north < 0 ? 'S' : 'N'}`;
	return `${lonLabel}_${latLabel}`;
}

// GHSL R2023A WGS84 3ss tiles are 10° (12000 px) but their grid is offset from whole
// degrees: tile R9_C18 spans -10.0079…-0.0079 E, -0.9004…9.0996 N (read from the files).
const GHSL_ORIGIN_X = -180.00791667;
const GHSL_ORIGIN_Y = 89.09958333;

/** GHSL tile ids (R<row>_C<col>, 1-based from the grid origin) that intersect `bbox` */
export function ghslTiles(bbox: BBox): string[] {
	const [w, s, e, n] = bbox;
	const tiles: string[] = [];
	for (
		let row = Math.floor((GHSL_ORIGIN_Y - n) / 10);
		row <= Math.floor((GHSL_ORIGIN_Y - s) / 10);
		row++
	) {
		for (
			let col = Math.floor((w - GHSL_ORIGIN_X) / 10);
			col <= Math.floor((e - GHSL_ORIGIN_X) / 10);
			col++
		) {
			tiles.push(`R${row + 1}_C${col + 1}`);
		}
	}
	return tiles;
}

/** GHSL built-up epochs used for the urban growth series */
export const GHSL_EPOCHS = [1975, 1990, 2000, 2010, 2020, 2030];
