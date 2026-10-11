/**
 * Captures pages with the system's Microsoft Edge (headless) after the network settles
 * and reports console errors and failed requests.
 *
 *   tsx scripts/screenshot.ts <out-dir> <name>=<url>[@<width>x<height>] ...
 *   FULL_PAGE=1 captures the whole page instead of the first viewport
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const EDGE =
	process.env.EDGE_PATH ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const [outDir, ...shots] = process.argv.slice(2);
if (!outDir || !shots.length) {
	console.error('usage: tsx scripts/screenshot.ts <out-dir> <name>=<url>[@<w>x<h>] ...');
	process.exit(2);
}
await mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({ executablePath: EDGE, headless: true });
let problems = 0;
try {
	for (const shot of shots) {
		const [, name, url, w = '1280', h = '800'] =
			shot.match(/^([^=]+)=(.+?)(?:@(\d+)x(\d+))?$/) ?? [];
		const page = await browser.newPage();
		await page.setViewport({ width: Number(w), height: Number(h) });
		const issues: string[] = [];
		page.on('console', async (m) => {
			if (m.type() !== 'error') return;
			// Error objects print as [object …]; ask the page for their message
			const args = await Promise.all(
				m
					.args()
					.map((a) =>
						a.evaluate((v) => (v instanceof Error ? v.message : String(v))).catch(() => '?')
					)
			);
			issues.push(`console: ${args.join(' ') || m.text()}`);
		});
		page.on('pageerror', (e) => issues.push(`page error: ${(e as Error).message}`));
		page.on('requestfailed', (r) => issues.push(`failed: ${r.url()} (${r.failure()?.errorText})`));
		page.on('response', (r) => r.status() >= 400 && issues.push(`${r.status()}: ${r.url()}`));

		await page.goto(url, { waitUntil: 'networkidle0', timeout: 60_000 }).catch((e) => {
			issues.push(`navigation: ${(e as Error).message}`);
		});
		await new Promise((r) => setTimeout(r, 1500)); // let the map finish drawing
		const file = path.join(outDir, `${name}.png`);
		await page.screenshot({
			path: file as `${string}.png`,
			fullPage: process.env.FULL_PAGE === '1'
		});
		console.log(`${name}: ${file}`);
		for (const i of issues) console.log(`  ${i.slice(0, 300)}`);
		problems += issues.length;
		await page.close();
	}
} finally {
	await browser.close();
}
process.exitCode = problems ? 1 : 0;
