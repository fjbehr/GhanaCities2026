/** NASA FIRMS active fires (VIIRS S-NPP, near real time); needs a free MAP_KEY */

export interface FireCollection {
	type: 'FeatureCollection';
	features: {
		type: 'Feature';
		geometry: { type: 'Point'; coordinates: [number, number] };
		properties: { date: string; time: string; confidence: string; frp: number; daynight: string };
	}[];
}

/** Ghana with a small margin, [west, south, east, north] */
export const GHANA_BBOX = [-3.4, 4.6, 1.3, 11.3];

/** Converts the FIRMS area CSV to GeoJSON points */
export function parseFirmsCsv(csv: string): FireCollection {
	const [header, ...lines] = csv.trim().split(/\r?\n/);
	if (!header?.includes('latitude'))
		throw new Error(`Unexpected FIRMS response: ${header?.slice(0, 120)}`);
	const cols = header.split(',');
	const at = (name: string) => cols.indexOf(name);
	return {
		type: 'FeatureCollection',
		features: lines
			.filter((l) => l.trim())
			.map((line) => {
				const v = line.split(',');
				const time = v[at('acq_time')].padStart(4, '0');
				return {
					type: 'Feature' as const,
					geometry: {
						type: 'Point' as const,
						coordinates: [Number(v[at('longitude')]), Number(v[at('latitude')])] as [number, number]
					},
					properties: {
						date: v[at('acq_date')],
						time: `${time.slice(0, 2)}:${time.slice(2)} UTC`,
						confidence:
							{ l: 'low', n: 'nominal', h: 'high' }[v[at('confidence')]] ?? v[at('confidence')],
						frp: Number(v[at('frp')]),
						daynight: v[at('daynight')] === 'D' ? 'day' : 'night'
					}
				};
			})
	};
}

export async function fetchFires(mapKey: string, days = 2): Promise<FireCollection> {
	const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/VIIRS_SNPP_NRT/${GHANA_BBOX.join(',')}/${days}`;
	const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
	if (!res.ok) throw new Error(`FIRMS ${res.status}`);
	return parseFirmsCsv(await res.text());
}
