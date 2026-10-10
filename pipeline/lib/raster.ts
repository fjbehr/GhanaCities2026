import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fromFile, writeArrayBuffer, type GeoTIFFImage, type TypedArray } from 'geotiff';
import type { BBox } from '../../src/lib/config/cities.ts';

/** A north-up raster window in EPSG:4326 */
export interface Clip {
	data: TypedArray;
	width: number;
	height: number;
	/** Top-left corner */
	originX: number;
	originY: number;
	resX: number;
	resY: number;
	nodata: number | null;
}

async function openImages(files: string[]) {
	return Promise.all(files.map(async (f) => (await fromFile(f)).getImage()));
}

/**
 * Cuts `bbox` out of one or more adjacent tiles of the same product (same resolution
 * and pixel grid), snapping outward to whole pixels. Cells no tile covers get nodata.
 */
export async function clip(
	files: string[],
	bbox: BBox,
	/** For products that use a nodata value without declaring it in the file (CHIRPS: -9999) */
	{ nodata: declaredNodata }: { nodata?: number } = {}
): Promise<Clip> {
	const images = await openImages(files);
	const [w, s, e, n] = bbox;
	const [ox, oy] = images[0].getOrigin();
	const [resX, negResY] = images[0].getResolution();
	const resY = Math.abs(negResY);
	for (const img of images) {
		const [rx, ry] = img.getResolution();
		if (Math.abs(rx - resX) > resX * 1e-6 || Math.abs(Math.abs(ry) - resY) > resY * 1e-6) {
			throw new Error('clip: tiles differ in resolution');
		}
	}

	// Snap to the shared pixel grid of the product
	const x0 = ox + Math.floor((w - ox) / resX) * resX;
	const x1 = ox + Math.ceil((e - ox) / resX) * resX;
	const yTop = oy - Math.floor((oy - n) / resY) * resY;
	const yBottom = oy - Math.ceil((oy - s) / resY) * resY;
	const width = Math.round((x1 - x0) / resX);
	const height = Math.round((yTop - yBottom) / resY);
	const nodata = declaredNodata ?? images[0].getGDALNoData();

	let out: TypedArray | undefined;
	for (const img of images) {
		const [ix, iy] = img.getOrigin();
		const col0 = Math.max(0, Math.round((x0 - ix) / resX));
		const col1 = Math.min(img.getWidth(), Math.round((x1 - ix) / resX));
		const row0 = Math.max(0, Math.round((iy - yTop) / resY));
		const row1 = Math.min(img.getHeight(), Math.round((iy - yBottom) / resY));
		if (col1 <= col0 || row1 <= row0) continue;

		const part = (await img.readRasters({
			window: [col0, row0, col1, row1],
			samples: [0],
			interleave: true
		})) as unknown as TypedArray;
		if (!out) {
			const Ctor = part.constructor as new (length: number) => TypedArray;
			out = new Ctor(width * height);
			out.fill(nodata ?? 0);
		}
		const destCol = Math.round((ix + col0 * resX - x0) / resX);
		const destRow = Math.round((yTop - (iy - row0 * resY)) / resY);
		const partWidth = col1 - col0;
		for (let r = 0; r < row1 - row0; r++) {
			const src = part.subarray(r * partWidth, (r + 1) * partWidth);
			out.set(src as never, (destRow + r) * width + destCol);
		}
	}
	if (!out) throw new Error(`clip: no tile covers ${bbox.join(',')}`);

	return { data: out, width, height, originX: x0, originY: yTop, resX, resY, nodata };
}

/** Writes a clip as an uncompressed single-band GeoTIFF (EPSG:4326, pixel-is-area). */
export async function writeTiff(file: string, c: Clip): Promise<void> {
	const buffer = writeArrayBuffer(c.data, {
		width: c.width,
		height: c.height,
		ModelPixelScale: [c.resX, c.resY, 0],
		ModelTiepoint: [0, 0, 0, c.originX, c.originY, 0],
		GTModelTypeGeoKey: 2,
		GTRasterTypeGeoKey: 1,
		GeographicTypeGeoKey: 4326,
		GeogCitationGeoKey: 'WGS 84',
		...(c.nodata !== null && { GDAL_NODATA: `${c.nodata}\0` })
	});
	await mkdir(path.dirname(file), { recursive: true });
	await writeFile(file, Buffer.from(buffer));
}

/** Mean of all valid cells, e.g. a city-wide rainfall normal */
export function mean(c: Clip): number | null {
	let sum = 0;
	let count = 0;
	for (const v of c.data as Iterable<number>) {
		if (v === c.nodata || Number.isNaN(v)) continue;
		sum += v;
		count++;
	}
	return count ? sum / count : null;
}

export type { GeoTIFFImage };
