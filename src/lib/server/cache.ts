import type postgres from 'postgres';

export interface CacheEntry {
	payload: unknown;
	fetchedAt: Date;
	expiresAt: Date;
}

export interface CacheStore {
	get(key: string): Promise<CacheEntry | null>;
	set(key: string, payload: unknown, fetchedAt: Date, expiresAt: Date): Promise<void>;
}

export interface Cached<T> {
	data: T;
	fetchedAt: string;
	/** True when the source failed and an expired copy is served instead */
	stale: boolean;
}

const pending = new Map<string, Promise<Cached<unknown>>>();

/**
 * Returns a fresh cached value, or fetches and stores a new one. When fetching fails,
 * an expired copy is served (marked stale) rather than nothing. Concurrent requests for
 * the same key share one fetch.
 */
export function cached<T>(
	store: CacheStore,
	key: string,
	ttlSeconds: number,
	fetcher: () => Promise<T>,
	now: () => Date = () => new Date()
): Promise<Cached<T>> {
	const running = pending.get(key);
	if (running) return running as Promise<Cached<T>>;

	const job = (async (): Promise<Cached<T>> => {
		const hit = await store.get(key);
		const t = now();
		if (hit && hit.expiresAt > t) {
			return { data: hit.payload as T, fetchedAt: hit.fetchedAt.toISOString(), stale: false };
		}
		try {
			const data = await fetcher();
			await store.set(key, data, t, new Date(t.getTime() + ttlSeconds * 1000));
			return { data, fetchedAt: t.toISOString(), stale: false };
		} catch (error) {
			if (hit)
				return { data: hit.payload as T, fetchedAt: hit.fetchedAt.toISOString(), stale: true };
			throw error;
		}
	})().finally(() => pending.delete(key));

	pending.set(key, job);
	return job;
}

/** Cache store backed by the api_cache table */
export function pgStore(sql: postgres.Sql): CacheStore {
	return {
		async get(key) {
			const [row] = await sql`
				SELECT payload, fetched_at, expires_at FROM api_cache WHERE key = ${key}`;
			return row
				? { payload: row.payload, fetchedAt: row.fetched_at, expiresAt: row.expires_at }
				: null;
		},
		async set(key, payload, fetchedAt, expiresAt) {
			await sql`
				INSERT INTO api_cache (key, payload, fetched_at, expires_at)
				VALUES (${key}, ${sql.json(payload as postgres.JSONValue)}, ${fetchedAt}, ${expiresAt})
				ON CONFLICT (key) DO UPDATE SET
					payload = excluded.payload, fetched_at = excluded.fetched_at, expires_at = excluded.expires_at`;
		}
	};
}
