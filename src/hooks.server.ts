import type { Handle } from '@sveltejs/kit/hooks';
import { BASEMAP_URL, GEOSERVER_URL } from '$app/env/private';
import { compress } from '#lib/server/compress.ts';
import { proxy, resolveTarget, type ProxyRoute } from '#lib/server/proxy.ts';

// Same-origin access to the OGC services and vector tiles, so Masterportal
// and the site need no CORS configuration.
const proxyRoutes: ProxyRoute[] = [
	{ name: 'GeoServer', prefix: '/geoserver', target: GEOSERVER_URL },
	{ name: 'The basemap tile server', prefix: '/basemap', target: BASEMAP_URL }
];

export const handle: Handle = async ({ event, resolve }) => {
	for (const route of proxyRoutes) {
		const target = resolveTarget(event.url, route);
		if (target) {
			return proxy(event.request, target, route, {
				url: event.url,
				clientAddress: event.getClientAddress()
			});
		}
	}
	return compress(
		event.request,
		await resolve(event, {
			// Also preload the Latin body font, so text does not reflow when it arrives
			preload: ({ type, path }) =>
				type === 'js' || type === 'css' || (type === 'font' && path.includes('-latin-wght-'))
		})
	);
};
