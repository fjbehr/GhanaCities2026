import { describe, expect, it } from 'vitest';
import { toCsv } from './csv.ts';

describe('toCsv', () => {
	it('writes a header and quotes only where needed', () => {
		expect(
			toCsv([
				{ name: 'Accra Metropolis', population: 103705, note: null },
				{ name: 'Ga South, "Weija"', population: 1.5, note: 'line\nbreak' }
			])
		).toBe(
			'name,population,note\r\nAccra Metropolis,103705,\r\n"Ga South, ""Weija""",1.5,"line\nbreak"\r\n'
		);
	});

	it('returns an empty string for no rows', () => {
		expect(toCsv([])).toBe('');
	});
});
