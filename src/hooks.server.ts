import type { Handle } from '@sveltejs/kit/hooks';
import { BASEMAP_URL, GEOSERVER_ADMIN, GEOSERVER_URL } from '$app/env/private';
import { compress } from '#lib/server/compress.ts';
import { geoServerAccess } from '#lib/server/geoserver-access.ts';
import { proxy, resolveTarget, type ProxyRoute } from '#lib/server/proxy.ts';

// Same-origin access to the OGC services and vector tiles, so Masterportal
// and the site need no CORS configuration.
const proxyRoutes: ProxyRoute[] = [
	// Read-only map services; the admin interface only with GEOSERVER_ADMIN=true, REST never
	{
		name: 'GeoServer',
		prefix: '/geoserver',
		target: GEOSERVER_URL,
		allow: geoServerAccess(GEOSERVER_ADMIN)
	},
	{
		name: 'The basemap tile server',
		prefix: '/basemap',
		target: BASEMAP_URL,
		allow: (method) => method === 'GET' || method === 'HEAD'
	}
];

export const handle: Handle = async ({ event, resolve }) => {
	for (const route of proxyRoutes) {
		const target = resolveTarget(event.url, route);
		if (target) {
			const path = event.url.pathname.slice(route.prefix.length);
			if (route.allow && !route.allow(event.request.method, path, event.url.searchParams)) {
				return new Response(
					`Not available through this site. ${route.name} offers its public map services here.`,
					{
						status: 403,
						headers: { 'content-type': 'text/plain; charset=utf-8' }
					}
				);
			}
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
