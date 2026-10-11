import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { compress } from './compress.ts';

const html = '<p>' + 'Rain, heat, air and services. '.repeat(100) + '</p>';
const request = (encoding?: string, method = 'GET') =>
	new Request('http://localhost/', {
		method,
		headers: encoding ? { 'accept-encoding': encoding } : {}
	});
const response = (body: string, type = 'text/html') =>
	new Response(body, { headers: { 'content-type': type } });

describe('compress', () => {
	it('gzips pages for clients that accept it', async () => {
		const res = compress(request('gzip, deflate, br'), response(html));
		expect(res.headers.get('content-encoding')).toBe('gzip');
		expect(res.headers.get('vary')).toContain('Accept-Encoding');
		const body = Buffer.from(await res.arrayBuffer());
		expect(gunzipSync(body).toString()).toBe(html);
	});

	it('leaves responses alone when the client does not accept gzip', () => {
		const res = compress(request(), response(html));
		expect(res.headers.has('content-encoding')).toBe(false);
	});

	it('skips images, small bodies and HEAD requests', () => {
		expect(
			compress(request('gzip'), response(html, 'image/png')).headers.has('content-encoding')
		).toBe(false);
		const small = new Response('ok', {
			headers: { 'content-type': 'text/plain', 'content-length': '2' }
		});
		expect(compress(request('gzip'), small).headers.has('content-encoding')).toBe(false);
		expect(compress(request('gzip', 'HEAD'), response(html)).headers.has('content-encoding')).toBe(
			false
		);
	});
});
