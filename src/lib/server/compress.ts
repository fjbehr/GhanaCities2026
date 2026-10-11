/**
 * Gzip for rendered pages and API responses. adapter-node precompresses static files, but
 * pages and JSON/CSV are produced per request and would otherwise go out uncompressed,
 * which matters on slow mobile connections.
 */
const COMPRESSIBLE = /^(text\/|application\/(json|geo\+json|javascript|xml))/;
/** Below this, gzip overhead outweighs the saving */
const MIN_BYTES = 1024;

export function compress(request: Request, response: Response): Response {
	const type = response.headers.get('content-type') ?? '';
	const length = Number(response.headers.get('content-length') ?? Infinity);
	if (
		!response.body ||
		request.method === 'HEAD' ||
		response.status === 204 ||
		response.status === 304 ||
		response.headers.has('content-encoding') ||
		!COMPRESSIBLE.test(type) ||
		length < MIN_BYTES ||
		!/\bgzip\b/.test(request.headers.get('accept-encoding') ?? '')
	) {
		return response;
	}

	const headers = new Headers(response.headers);
	headers.set('content-encoding', 'gzip');
	headers.delete('content-length');
	headers.append('vary', 'Accept-Encoding');
	return new Response(response.body.pipeThrough(new CompressionStream('gzip')), {
		status: response.status,
		statusText: response.statusText,
		headers
	});
}
