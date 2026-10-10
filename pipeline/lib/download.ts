import { createWriteStream, existsSync } from 'node:fs';
import { mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream } from 'node:stream/web';

export type DownloadResult = 'downloaded' | 'cached' | 'missing';

/** `--refresh` on the command line re-downloads files that already exist */
export const refresh = process.argv.includes('--refresh');

/** fetch with retries for network errors and 5xx (some data hosts are flaky) */
export async function fetchRetry(
	url: string,
	init: RequestInit = {},
	tries = 4
): Promise<Response> {
	for (let attempt = 1; ; attempt++) {
		try {
			const res = await fetch(url, { redirect: 'follow', ...init });
			if (res.status < 500 || attempt >= tries) return res;
		} catch (error) {
			if (attempt >= tries)
				throw new Error(`${url}: ${(error as Error).message}`, { cause: error });
		}
		await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
	}
}

/**
 * Downloads `url` to `dest` unless it already exists. Writes to a .part file first,
 * so an interrupted run never leaves a truncated file at `dest`.
 * Returns 'missing' for a 404 when `optional` is set (e.g. DEM tiles that are all ocean).
 */
export async function download(
	url: string,
	dest: string,
	{ optional = false } = {}
): Promise<DownloadResult> {
	if (existsSync(dest) && !refresh) return 'cached';

	const res = await fetchRetry(url);
	if (res.status === 404 && optional) return 'missing';
	if (!res.ok || !res.body) throw new Error(`GET ${url}: ${res.status}`);

	await mkdir(path.dirname(dest), { recursive: true });
	const part = `${dest}.part`;
	const total = Number(res.headers.get('content-length')) || 0;
	let received = 0;
	let lastLog = Date.now();
	const body = Readable.fromWeb(res.body as ReadableStream);
	body.on('data', (chunk: Buffer) => {
		received += chunk.length;
		if (total && Date.now() - lastLog > 10_000) {
			lastLog = Date.now();
			console.log(`  ${path.basename(dest)}: ${Math.round((received / total) * 100)} %`);
		}
	});

	try {
		await pipeline(body, createWriteStream(part));
		if (total && received !== total) throw new Error(`${url}: incomplete download`);
	} catch (error) {
		await rm(part, { force: true });
		throw error;
	}
	await rename(part, dest);
	return 'downloaded';
}
