/**
 * Landsat 8/9 Collection 2 Level-2 surface temperature from Microsoft Planetary Computer
 * (free, no account). Only the windows covering a city are read from the cloud-optimised
 * GeoTIFFs, reprojected from UTM onto a WGS84 grid and combined into a median composite.
 */
import { fromUrl } from 'geotiff';
import proj4 from 'proj4';
import type { BBox } from '../../src/lib/config/cities.ts';
import { fetchRetry } from './download.ts';
import type { Clip } from './raster.ts';

const STAC = 'https://planetarycomputer.microsoft.com/api/stac/v1/search';
const TOKEN = 'https://planetarycomputer.microsoft.com/api/sas/v1/token/landsat-c2-l2';

// Surface temperature band (ST_B10): kelvin = DN × 0.00341802 + 149; DN 0 is fill
const ST_SCALE = 0.00341802;
const ST_OFFSET = 149;

/** QA_PIXEL bits 0–4: fill, dilated cloud, cirrus, cloud, cloud shadow */
const QA_UNUSABLE = 0b11111;

export type Grid = Omit<Clip, 'data' | 'nodata'>;

export interface Scene {
	id: string;
	date: string;
	epsg: number;
	cloudCover: number;
	lwir: string;
	qa: string;
}

export const isClear = (qa: number) => (qa & QA_UNUSABLE) === 0;
export const toCelsius = (dn: number) => dn * ST_SCALE + ST_OFFSET - 273.15;

/** Median of the values that are not NaN; NaN when fewer than `minCount` remain */
export function median(values: ArrayLike<number>, minCount = 1): number {
	const v: number[] = [];
	for (let i = 0; i < values.length; i++) if (!Number.isNaN(values[i])) v.push(values[i]);
	if (v.length < minCount || !v.length) return NaN;
	v.sort((a, b) => a - b);
	const mid = v.length >> 1;
	return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

/** A north-up WGS84 grid of `res` degrees snapped to multiples of `res` */
export function gridFor([w, s, e, n]: BBox, res: number): Grid {
	const originX = Math.floor(w / res) * res;
	const originY = Math.ceil(n / res) * res;
	return {
		originX,
		originY,
		resX: res,
		resY: res,
		// Tolerance: 701.0000000001 cells must count as 701
		width: Math.ceil((e - originX) / res - 1e-9),
		height: Math.ceil((originY - s) / res - 1e-9)
	};
}

/** Daytime Landsat 8/9 scenes over `bbox` within the given ISO date ranges */
export async function searchScenes(bbox: BBox, ranges: string[], maxCloud: number) {
	const scenes: Scene[] = [];
	for (const datetime of ranges) {
		const res = await fetchRetry(STAC, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				collections: ['landsat-c2-l2'],
				bbox,
				datetime,
				query: {
					'eo:cloud_cover': { lt: maxCloud },
					platform: { in: ['landsat-8', 'landsat-9'] }
				},
				limit: 100
			})
		});
		if (!res.ok) throw new Error(`STAC search: ${res.status}`);
		const { features } = (await res.json()) as {
			features: {
				id: string;
				properties: Record<string, unknown>;
				assets: Record<string, { href: string }>;
			}[];
		};
		for (const f of features) {
			const code = String(f.properties['proj:epsg'] ?? f.properties['proj:code'] ?? '');
			scenes.push({
				id: f.id,
				date: String(f.properties.datetime).slice(0, 10),
				epsg: Number(code.replace('EPSG:', '')),
				cloudCover: Number(f.properties['eo:cloud_cover']),
				lwir: f.assets.lwir11.href,
				qa: f.assets.qa_pixel.href
			});
		}
	}
	return scenes;
}

/** Shared-access token for the Landsat storage account (valid about an hour) */
export async function storageToken(): Promise<string> {
	const res = await fetchRetry(TOKEN);
	if (!res.ok) throw new Error(`SAS token: ${res.status}`);
	return ((await res.json()) as { token: string }).token;
}

/** UTM coordinates of every grid cell centre (cached per zone by the caller) */
export function utmCoordinates(grid: Grid, epsg: number) {
	const zone = epsg % 100;
	const south = Math.floor(epsg / 100) === 327 ? ' +south' : '';
	const toUtm = proj4(
		'EPSG:4326',
		`+proj=utm +zone=${zone}${south} +datum=WGS84 +units=m +no_defs`
	);
	const e = new Float64Array(grid.width * grid.height);
	const n = new Float64Array(grid.width * grid.height);
	for (let row = 0; row < grid.height; row++) {
		const lat = grid.originY - (row + 0.5) * grid.resY;
		for (let col = 0; col < grid.width; col++) {
			const [x, y] = toUtm.forward([grid.originX + (col + 0.5) * grid.resX, lat]);
			e[row * grid.width + col] = x;
			n[row * grid.width + col] = y;
		}
	}
	return { e, n };
}

/**
 * Samples one scene onto the grid (nearest neighbour): °C where the pixel is clear,
 * NaN elsewhere. Reads only the window that covers the grid.
 */
export async function sampleScene(
	scene: Scene,
	token: string,
	coords: { e: Float64Array; n: Float64Array }
): Promise<Float32Array> {
	const [lwir, qa] = await Promise.all(
		[scene.lwir, scene.qa].map(async (href) => (await fromUrl(`${href}?${token}`)).getImage())
	);
	const [x0, y0] = lwir.getOrigin();
	const [rx, ry] = lwir.getResolution();
	const res = Math.abs(rx);
	if (Math.abs(Math.abs(ry) - res) > 1e-6) throw new Error(`${scene.id}: non-square pixels`);

	let minE = Infinity, maxE = -Infinity, minN = Infinity, maxN = -Infinity; // prettier-ignore
	for (let i = 0; i < coords.e.length; i++) {
		minE = Math.min(minE, coords.e[i]);
		maxE = Math.max(maxE, coords.e[i]);
		minN = Math.min(minN, coords.n[i]);
		maxN = Math.max(maxN, coords.n[i]);
	}
	const col0 = Math.max(0, Math.floor((minE - x0) / res) - 1);
	const col1 = Math.min(lwir.getWidth(), Math.ceil((maxE - x0) / res) + 1);
	const row0 = Math.max(0, Math.floor((y0 - maxN) / res) - 1);
	const row1 = Math.min(lwir.getHeight(), Math.ceil((y0 - minN) / res) + 1);

	const out = new Float32Array(coords.e.length).fill(NaN);
	if (col1 <= col0 || row1 <= row0) return out; // scene does not reach this city

	const window = [col0, row0, col1, row1];
	const [dn, flags] = (await Promise.all(
		[lwir, qa].map((img) => img.readRasters({ window, samples: [0], interleave: true }))
	)) as unknown as Uint16Array[];
	const w = col1 - col0;
	for (let i = 0; i < out.length; i++) {
		const c = Math.floor((coords.e[i] - x0) / res) - col0;
		const r = Math.floor((y0 - coords.n[i]) / res) - row0;
		if (c < 0 || r < 0 || c >= w || r >= row1 - row0) continue;
		const k = r * w + c;
		if (dn[k] === 0 || !isClear(flags[k])) continue;
		out[i] = toCelsius(dn[k]);
	}
	return out;
}
