import http from 'node:http';
import https from 'node:https';
import { Readable } from 'node:stream';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';

/** A path prefix on this site that is forwarded to an upstream service. */
export interface ProxyRoute {
	/** Shown in the 502 message when the upstream is down */
	name: string;
	/** Public path prefix without trailing slash, e.g. `/geoserver` */
	prefix: string;
	/** Upstream base URL; the part after `prefix` is appended to its path */
	target: string;
	/** Which requests may pass; `path` is the part after `prefix`. Default: all */
	allow?: (method: string, path: string, search: URLSearchParams) => boolean;
}

// Hop-by-hop headers (RFC 9110 §7.6.1) plus `host`, which must match the upstream
const HOP_BY_HOP = new Set([
	'connection',
	'keep-alive',
	'proxy-authenticate',
	'proxy-authorization',
	'proxy-connection',
	'te',
	'trailer',
	'transfer-encoding',
	'upgrade',
	'host'
]);

const TIMEOUT_MS = 60_000;

/** Maps a public URL to the upstream URL, or `null` if the route does not apply. */
export function resolveTarget(url: URL, route: ProxyRoute): URL | null {
	const { pathname } = url;
	if (pathname !== route.prefix && !pathname.startsWith(route.prefix + '/')) return null;

	const target = new URL(route.target);
	target.pathname = target.pathname.replace(/\/$/, '') + pathname.slice(route.prefix.length);
	target.search = url.search;
	return target;
}

/** Rewrites an absolute upstream redirect so the browser stays on this site. */
export function rewriteLocation(location: string, route: ProxyRoute, origin: string): string {
	const base = route.target.replace(/\/$/, '');
	if (location !== base && !location.startsWith(base + '/') && !location.startsWith(base + '?')) {
		return location;
	}
	return origin + route.prefix + location.slice(base.length);
}

interface ProxyOptions {
	/** Public URL of the incoming request, used for X-Forwarded-* and redirects */
	url: URL;
	clientAddress: string;
}

/**
 * Streams the request to `target` and the upstream response back unchanged.
 *
 * Uses node:http instead of fetch, because fetch transparently decompresses
 * bodies — gzip-encoded vector tiles must reach the browser as they are.
 */
export function proxy(
	request: Request,
	target: URL,
	route: ProxyRoute,
	{ url, clientAddress }: ProxyOptions
): Promise<Response> {
	const headers: http.OutgoingHttpHeaders = {};
	for (const [key, value] of request.headers) {
		if (!HOP_BY_HOP.has(key)) headers[key] = value;
	}
	const forwardedFor = request.headers.get('x-forwarded-for');
	headers['x-forwarded-for'] = forwardedFor ? `${forwardedFor}, ${clientAddress}` : clientAddress;
	headers['x-forwarded-host'] = url.host;
	headers['x-forwarded-proto'] = url.protocol.slice(0, -1);
	headers['x-forwarded-prefix'] = route.prefix;

	const client = target.protocol === 'https:' ? https : http;

	return new Promise((resolve) => {
		const upstream = client.request(target, { method: request.method, headers }, (res) => {
			const responseHeaders = new Headers();
			for (const [key, value] of Object.entries(res.headers)) {
				if (value === undefined || HOP_BY_HOP.has(key)) continue;
				for (const v of Array.isArray(value) ? value : [value]) {
					responseHeaders.append(
						key,
						key === 'location' ? rewriteLocation(v, route, url.origin) : v
					);
				}
			}

			const status = res.statusCode ?? 502;
			const hasBody = request.method !== 'HEAD' && status !== 204 && status !== 304;
			if (!hasBody) res.resume();

			resolve(
				new Response(hasBody ? (Readable.toWeb(res) as ReadableStream) : null, {
					status,
					statusText: res.statusMessage,
					headers: responseHeaders
				})
			);
		});

		upstream.setTimeout(TIMEOUT_MS, () => upstream.destroy(new Error('upstream timeout')));
		upstream.on('error', (error: NodeJS.ErrnoException) => {
			// `localhost` tries ::1 and 127.0.0.1; the resulting AggregateError has no message
			const reason = error.message || error.code || 'connection failed';
			resolve(
				new Response(`${route.name} is not reachable (${reason}).`, {
					status: 502,
					headers: { 'content-type': 'text/plain; charset=utf-8' }
				})
			);
		});

		if (request.body && request.method !== 'GET' && request.method !== 'HEAD') {
			Readable.fromWeb(request.body as NodeReadableStream).pipe(upstream);
		} else {
			upstream.end();
		}
	});
}
