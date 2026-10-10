import postgres from 'postgres';
import { requireEnv } from './env.ts';

export const sql = postgres(requireEnv('DATABASE_URL'), {
	onnotice: () => {},
	max: 4
});
