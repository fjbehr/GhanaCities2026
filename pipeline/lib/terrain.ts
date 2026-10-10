import type { Clip } from './raster.ts';

export const LOW_LYING = 1;
export const NOT_LOW_LYING = 0;
export const NO_DATA = 255;

/**
 * Marks valley bottoms and depressions: cells at least `depth` metres below the mean
 * elevation within `radius` cells (a topographic position index). Uses a summed-area
 * table, so the cost does not grow with the radius.
 */
export function lowLying(dem: Clip, radius: number, depth: number): Clip {
	const { width: w, height: h } = dem;
	const values = dem.data as ArrayLike<number>;
	const valid = (v: number) => v !== dem.nodata && !Number.isNaN(v);

	// (w+1)×(h+1) prefix sums of elevation and of valid-cell counts
	const sum = new Float64Array((w + 1) * (h + 1));
	const cnt = new Uint32Array((w + 1) * (h + 1));
	for (let y = 0; y < h; y++) {
		let rowSum = 0;
		let rowCnt = 0;
		for (let x = 0; x < w; x++) {
			const v = values[y * w + x];
			if (valid(v)) {
				rowSum += v;
				rowCnt++;
			}
			const i = (y + 1) * (w + 1) + x + 1;
			sum[i] = sum[i - (w + 1)] + rowSum;
			cnt[i] = cnt[i - (w + 1)] + rowCnt;
		}
	}
	const rect = (a: Float64Array | Uint32Array, x0: number, y0: number, x1: number, y1: number) =>
		a[y1 * (w + 1) + x1] - a[y0 * (w + 1) + x1] - a[y1 * (w + 1) + x0] + a[y0 * (w + 1) + x0];

	const out = new Uint8Array(w * h);
	for (let y = 0; y < h; y++) {
		const y0 = Math.max(0, y - radius);
		const y1 = Math.min(h, y + radius + 1);
		for (let x = 0; x < w; x++) {
			const v = values[y * w + x];
			if (!valid(v)) {
				out[y * w + x] = NO_DATA;
				continue;
			}
			const x0 = Math.max(0, x - radius);
			const x1 = Math.min(w, x + radius + 1);
			const n = rect(cnt, x0, y0, x1, y1);
			const meanElevation = rect(sum, x0, y0, x1, y1) / n;
			out[y * w + x] = meanElevation - v >= depth ? LOW_LYING : NOT_LOW_LYING;
		}
	}
	return { ...dem, data: out, nodata: NO_DATA };
}
