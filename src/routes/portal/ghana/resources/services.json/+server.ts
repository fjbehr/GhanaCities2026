import { json } from '@sveltejs/kit';
import { services } from '../../../../../../portal-config/services.ts';
import type { RequestHandler } from './$types';

// Masterportal requires absolute service URLs; build them from the address the visitor used
export const GET: RequestHandler = ({ url }) =>
	json(services(url.origin), { headers: { 'cache-control': 'public, max-age=300' } });
