import postgres from 'postgres';
import { DATABASE_URL } from '$app/env/private';

let client: postgres.Sql | undefined;

/** Shared connection pool to the app database */
export function db(): postgres.Sql {
	if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');
	client ??= postgres(DATABASE_URL, {
		max: 5,
		onnotice: () => {},
		// Indicator columns are rounded NUMERIC values; read them as numbers, not strings
		types: {
			numeric: {
				to: 1700,
				from: [1700],
				serialize: (v: number) => String(v),
				parse: (v: string) => Number(v)
			}
		}
	});
	return client;
}
