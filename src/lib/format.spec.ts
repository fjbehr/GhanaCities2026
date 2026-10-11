import { describe, expect, it } from 'vitest';
import { ago, dayName, monthName, num, people, pct, signedDegrees } from './format.ts';

describe('format', () => {
	it('formats numbers with thousands separators', () => {
		expect(num(379519)).toBe('379,519');
		expect(num(12.345, 1)).toBe('12.3');
		expect(num(null)).toBe('–');
	});

	it('rounds populations for reading', () => {
		expect(people(5624066)).toBe('5.6 million');
		expect(people(811887)).toBe('812,000');
		expect(people(9500)).toBe('9,500');
	});

	it('formats percentages and signed temperature differences', () => {
		expect(pct(83.4)).toBe('83 %');
		expect(signedDegrees(2.14)).toBe('+2.1 °C');
		expect(signedDegrees(-0.44)).toBe('−0.4 °C');
	});

	it('describes how old a value is', () => {
		const now = new Date('2026-10-11T12:00:00Z');
		expect(ago('2026-10-11T11:48:00Z', now)).toBe('12 min ago');
		expect(ago('2026-10-11T09:00:00Z', now)).toBe('3 h ago');
		expect(ago(null)).toBe('unknown');
	});

	it('names months and days', () => {
		expect(monthName('2026-03')).toBe('Mar');
		expect(monthName('11')).toBe('Nov');
		expect(dayName('2026-10-12')).toBe('Mon 12 Oct');
	});
});
