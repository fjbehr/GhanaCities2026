import { describe, expect, it, vi } from 'vitest';
import { cached, type CacheEntry, type CacheStore } from './cache.ts';

function memoryStore(initial: Record<string, CacheEntry> = {}): CacheStore & {
	entries: Record<string, CacheEntry>;
} {
	const entries = { ...initial };
	return {
		entries,
		get: async (key) => entries[key] ?? null,
		set: async (key, payload, fetchedAt, expiresAt) => {
			entries[key] = { payload, fetchedAt, expiresAt };
		}
	};
}

const at = (iso: string) => () => new Date(iso);

describe('cached', () => {
	it('fetches on a miss and stores the value with its TTL', async () => {
		const store = memoryStore();
		const result = await cached(store, 'k', 600, async () => 42, at('2026-10-10T10:00:00Z'));
		expect(result).toEqual({ data: 42, fetchedAt: '2026-10-10T10:00:00.000Z', stale: false });
		expect(store.entries.k.expiresAt.toISOString()).toBe('2026-10-10T10:10:00.000Z');
	});

	it('serves a fresh entry without fetching', async () => {
		const store = memoryStore({
			k: {
				payload: 'old',
				fetchedAt: new Date('2026-10-10T10:00:00Z'),
				expiresAt: new Date('2026-10-10T10:10:00Z')
			}
		});
		const fetcher = vi.fn(async () => 'new');
		const result = await cached(store, 'k', 600, fetcher, at('2026-10-10T10:05:00Z'));
		expect(result.data).toBe('old');
		expect(fetcher).not.toHaveBeenCalled();
	});

	it('refetches an expired entry', async () => {
		const store = memoryStore({
			k: {
				payload: 'old',
				fetchedAt: new Date('2026-10-10T10:00:00Z'),
				expiresAt: new Date('2026-10-10T10:10:00Z')
			}
		});
		const result = await cached(store, 'k', 600, async () => 'new', at('2026-10-10T10:11:00Z'));
		expect(result).toMatchObject({ data: 'new', stale: false });
	});

	it('falls back to the expired copy when the source fails', async () => {
		const store = memoryStore({
			k: {
				payload: 'old',
				fetchedAt: new Date('2026-10-10T10:00:00Z'),
				expiresAt: new Date('2026-10-10T10:10:00Z')
			}
		});
		const failing = async () => {
			throw new Error('down');
		};
		const result = await cached(store, 'k', 600, failing, at('2026-10-10T12:00:00Z'));
		expect(result).toEqual({ data: 'old', fetchedAt: '2026-10-10T10:00:00.000Z', stale: true });
		await expect(cached(memoryStore(), 'x', 600, failing)).rejects.toThrow('down');
	});

	it('shares one fetch between concurrent requests', async () => {
		const store = memoryStore();
		const fetcher = vi.fn(async () => 1);
		await Promise.all([cached(store, 'k', 60, fetcher), cached(store, 'k', 60, fetcher)]);
		expect(fetcher).toHaveBeenCalledTimes(1);
	});
});
