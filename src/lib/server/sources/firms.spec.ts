import { describe, expect, it } from 'vitest';
import { parseFirmsCsv } from './firms.ts';

// Column layout of the FIRMS area API (VIIRS_SNPP_NRT)
const csv = `latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight
9.41234,-0.85321,330.5,0.39,0.36,2026-01-14,138,N,VIIRS,n,2.0NRT,290.1,4.2,N
9.50011,-0.90045,345.2,0.41,0.37,2026-01-14,1312,N,VIIRS,h,2.0NRT,300.4,12.8,D
`;

describe('parseFirmsCsv', () => {
	it('turns rows into GeoJSON points with readable properties', () => {
		const fc = parseFirmsCsv(csv);
		expect(fc.features).toHaveLength(2);
		expect(fc.features[0].geometry.coordinates).toEqual([-0.85321, 9.41234]);
		expect(fc.features[0].properties).toEqual({
			date: '2026-01-14',
			time: '01:38 UTC',
			confidence: 'nominal',
			frp: 4.2,
			daynight: 'night'
		});
		expect(fc.features[1].properties).toMatchObject({ confidence: 'high', daynight: 'day' });
	});

	it('accepts an empty result and rejects error text', () => {
		expect(parseFirmsCsv(csv.split('\n')[0]).features).toEqual([]);
		expect(() => parseFirmsCsv('Invalid MAP_KEY.')).toThrow('Unexpected FIRMS response');
	});
});
