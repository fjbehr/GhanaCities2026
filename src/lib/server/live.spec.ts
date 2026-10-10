import { describe, expect, it, vi } from 'vitest';

// live.ts imports the database module, which needs SvelteKit's env; the headline logic does not
vi.mock('./db.ts', () => ({ db: () => ({}) }));
const { headline } = await import('./live.ts');

describe('headline', () => {
	it('is calm when nothing stands out', () => {
		expect(headline({ rain: { level: 'calm', label: '', advice: '' } })).toMatchObject({
			level: 'calm',
			label: 'Nothing unusual today',
			topic: null
		});
	});

	it('leads with the most severe reading, rain first on a tie', () => {
		const h = headline({
			heat: { level: 'act', label: 'Dangerous heat', advice: 'a' },
			rain: { level: 'act', label: 'Heavy rain likely', advice: 'b' },
			air: { level: 'watch', label: 'Moderate air quality', advice: 'c' }
		});
		expect(h).toEqual({ level: 'act', label: 'Heavy rain likely', advice: 'b', topic: 'rain' });
	});
});
