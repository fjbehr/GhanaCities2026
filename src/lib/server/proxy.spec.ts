import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { gzipSync, gunzipSync } from 'node:zlib';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { proxy, resolveTarget, rewriteLocation, type ProxyRoute } from './proxy';

const geoserver: ProxyRoute = {
	name: 'GeoServer',
	prefix: '/geoserver',
	target: 'http://localhost:8081/geoserver'
};
const basemap: ProxyRoute = {
	name: 'Basemap',
	prefix: '/basemap',
	target: 'http://localhost:8082'
};

describe('resolveTarget', () => {
	it('keeps path and query below the prefix', () => {
		const url = new URL('http://site/geoserver/ghana/wms?service=WMS&request=GetCapabilities');
		expect(resolveTarget(url, geoserver)?.href).toBe(
			'http://localhost:8081/geoserver/ghana/wms?service=WMS&request=GetCapabilities'
		);
	});

	it('maps onto an upstream without a base path', () => {
		const url = new URL('http://site/basemap/ghana/12/2040/1980.mvt');
		expect(resolveTarget(url, basemap)?.href).toBe('http://localhost:8082/ghana/12/2040/1980.mvt');
	});

	it('handles the bare prefix', () => {
		expect(resolveTarget(new URL('http://site/geoserver'), geoserver)?.href).toBe(
			'http://localhost:8081/geoserver'
		);
	});

	it('ignores paths that only share the prefix text', () => {
		expect(resolveTarget(new URL('http://site/geoserverx/a'), geoserver)).toBeNull();
		expect(resolveTarget(new URL('http://site/city/accra'), geoserver)).toBeNull();
	});
});

describe('rewriteLocation', () => {
	it('rewrites absolute upstream redirects to the public origin', () => {
		expect(
			rewriteLocation('http://localhost:8081/geoserver/web/', geoserver, 'http://localhost:3000')
		).toBe('http://localhost:3000/geoserver/web/');
	});

	it('leaves relative and foreign redirects alone', () => {
		expect(rewriteLocation('/geoserver/web/', geoserver, 'http://x')).toBe('/geoserver/web/');
		expect(rewriteLocation('https://example.org/', geoserver, 'http://x')).toBe(
			'https://example.org/'
		);
	});
});

describe('proxy', () => {
	let upstream: http.Server;
	let route: ProxyRoute;
	const options = { url: new URL('http://localhost:3000/up/x'), clientAddress: '10.0.0.7' };

	beforeAll(async () => {
		upstream = http.createServer((req, res) => {
			const chunks: Buffer[] = [];
			req.on('data', (c) => chunks.push(c));
			req.on('end', () => {
				if (req.url === '/base/tile') {
					res.writeHead(200, {
						'content-type': 'application/x-protobuf',
						'content-encoding': 'gzip'
					});
					res.end(gzipSync('tile-bytes'));
				} else if (req.url === '/base/redirect') {
					res.writeHead(302, { location: `${route.target}/web/` });
					res.end();
				} else {
					res.writeHead(200, { 'content-type': 'application/json', connection: 'close' });
					res.end(
						JSON.stringify({
							method: req.method,
							url: req.url,
							body: Buffer.concat(chunks).toString(),
							headers: req.headers
						})
					);
				}
			});
		});
		await new Promise<void>((r) => upstream.listen(0, '127.0.0.1', r));
		const { port } = upstream.address() as AddressInfo;
		route = { name: 'Test upstream', prefix: '/up', target: `http://127.0.0.1:${port}/base` };
	});

	afterAll(() => new Promise<void>((r) => upstream.close(() => r())));

	const forward = (request: Request) => {
		const target = resolveTarget(new URL(request.url), route);
		if (!target) throw new Error('route did not match');
		return proxy(request, target, route, options);
	};

	it('forwards method, path, query, body and X-Forwarded headers', async () => {
		const res = await forward(
			new Request('http://localhost:3000/up/wfs?service=WFS', {
				method: 'POST',
				headers: { 'content-type': 'text/xml', connection: 'keep-alive' },
				body: '<wfs:GetFeature/>'
			})
		);
		const echo = await res.json();
		expect(echo.method).toBe('POST');
		expect(echo.url).toBe('/base/wfs?service=WFS');
		expect(echo.body).toBe('<wfs:GetFeature/>');
		expect(echo.headers['content-type']).toBe('text/xml');
		expect(echo.headers['x-forwarded-host']).toBe('localhost:3000');
		expect(echo.headers['x-forwarded-proto']).toBe('http');
		expect(echo.headers['x-forwarded-for']).toBe('10.0.0.7');
		expect(echo.headers['x-forwarded-prefix']).toBe('/up');
		expect(res.headers.get('connection')).toBeNull();
	});

	it('passes compressed bodies through without decoding them', async () => {
		const res = await forward(new Request('http://localhost:3000/up/tile'));
		expect(res.headers.get('content-encoding')).toBe('gzip');
		const raw = Buffer.from(await res.arrayBuffer());
		expect(gunzipSync(raw).toString()).toBe('tile-bytes');
	});

	it('rewrites redirects to the public origin', async () => {
		const res = await forward(new Request('http://localhost:3000/up/redirect'));
		expect(res.status).toBe(302);
		expect(res.headers.get('location')).toBe('http://localhost:3000/up/web/');
	});

	it('answers 502 when the upstream is down', async () => {
		const down: ProxyRoute = { name: 'GeoServer', prefix: '/up', target: 'http://127.0.0.1:1' };
		const res = await proxy(
			new Request('http://localhost:3000/up/wms'),
			new URL('http://127.0.0.1:1/wms'),
			down,
			options
		);
		expect(res.status).toBe(502);
		expect(await res.text()).toMatch(/^GeoServer is not reachable/);
	});
});
