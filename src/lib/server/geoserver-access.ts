/**
 * Which GeoServer requests the public proxy forwards. By default only read-only map and
 * feature services. With the admin interface switched on (GEOSERVER_ADMIN=true), its pages
 * and login pass as well and GeoServer's own login protects them. The REST API always
 * stays local. GeoServer itself also refuses writes without admin credentials.
 */

/**
 * OGC endpoints and tile services of the "ghana" workspace only; the global endpoints
 * would also list GeoServer's bundled demo layers
 */
const PUBLIC_PATHS = [
	/^\/ghana\/(ows|wms|wfs|wcs)$/,
	/^\/ghana\/gwc\/service\/(wmts|tms|wms)(\/|$)/
];

/** Configuration by script only, never through the website */
const REST_PATHS = /^\/(gwc\/)?rest(\/|$)/i;

/** Requests that change data or make GeoServer fetch other URLs */
const BLOCKED_REQUESTS = new Set([
	'transaction',
	'lockfeature',
	'getfeaturewithlock',
	'createstoredquery',
	'dropstoredquery'
]);
const BLOCKED_PARAMS = new Set(['sld', 'sld_body']);

/** `path` is the part after the /geoserver prefix */
export function isPublicGeoServerRequest(method: string, path: string, search: URLSearchParams) {
	if (method !== 'GET' && method !== 'HEAD') return false;
	if (!PUBLIC_PATHS.some((p) => p.test(path))) return false;
	for (const [key, value] of search) {
		const k = key.toLowerCase();
		if (k === 'request' && BLOCKED_REQUESTS.has(value.toLowerCase())) return false;
		if (BLOCKED_PARAMS.has(k)) return false;
	}
	return true;
}

/** Access rule for the /geoserver proxy route */
export function geoServerAccess(adminInterface: boolean) {
	return (method: string, path: string, search: URLSearchParams) => {
		if (isPublicGeoServerRequest(method, path, search)) return true;
		// Admin pages, login and layer preview; GeoServer asks for the password
		return adminInterface && !REST_PATHS.test(path);
	};
}
