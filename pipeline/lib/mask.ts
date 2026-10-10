import type { Clip } from './raster.ts';

/** GeoJSON Polygon or MultiPolygon coordinates, flattened to rings */
export function rings(geometry: { type: string; coordinates: unknown }): number[][][] {
	if (geometry.type === 'Polygon') return geometry.coordinates as number[][][];
	if (geometry.type === 'MultiPolygon') return (geometry.coordinates as number[][][][]).flat();
	throw new Error(`Unsupported geometry type ${geometry.type}`);
}

/**
 * Rasterises polygon rings onto a clip's grid: 1 where the cell centre lies inside
 * (even-odd rule, so holes stay empty), 0 elsewhere. Scanline fill, one pass per row.
 */
export function polygonMask(grid: Omit<Clip, 'data' | 'nodata'>, polygonRings: number[][][]) {
	const { width, height, originX, originY, resX, resY } = grid;
	const mask = new Uint8Array(width * height);
	for (let row = 0; row < height; row++) {
		const y = originY - (row + 0.5) * resY;
		const xs: number[] = [];
		for (const ring of polygonRings) {
			for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
				const [x1, y1] = ring[j];
				const [x2, y2] = ring[i];
				if (y1 > y !== y2 > y) xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
			}
		}
		xs.sort((a, b) => a - b);
		for (let k = 0; k + 1 < xs.length; k += 2) {
			const from = Math.max(0, Math.ceil((xs[k] - originX) / resX - 0.5));
			const to = Math.min(width - 1, Math.floor((xs[k + 1] - originX) / resX - 0.5));
			if (to >= from) mask.fill(1, row * width + from, row * width + to + 1);
		}
	}
	return mask;
}

/**
 * Sets every cell outside the mask to nodata. Sources that declare none need a
 * `fallback` that never occurs as a real value (0 often means "none", not "no data").
 */
export function applyMask(c: Clip, mask: Uint8Array, fallback = 0): Clip {
	const nodata = c.nodata ?? fallback;
	const data = c.data.slice();
	for (let i = 0; i < mask.length; i++) if (!mask[i]) data[i] = nodata;
	return { ...c, data, nodata };
}
