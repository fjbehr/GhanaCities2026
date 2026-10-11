/**
 * Derives the served city photos from the Wikimedia originals in photos/:
 * WebP at 240, 480 and 800 px plus a 480 px JPEG fallback, into src/lib/assets/cities
 * (imported by Vite, so they get hashed names and long cache lifetimes).
 */
import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SRC = 'photos';
const OUT = path.join('src', 'lib', 'assets', 'cities');
await mkdir(OUT, { recursive: true });

for (const file of (await readdir(SRC)).filter((f) => f.endsWith('.jpg'))) {
	const slug = path.basename(file, '.jpg');
	const input = sharp(path.join(SRC, file));
	for (const w of [240, 480, 800]) {
		await input
			.clone()
			.resize({ width: w })
			.webp({ quality: 72 })
			.toFile(path.join(OUT, `${slug}-${w}.webp`));
	}
	await input
		.clone()
		.resize({ width: 480 })
		.jpeg({ quality: 78, mozjpeg: true })
		.toFile(path.join(OUT, `${slug}-480.jpg`));
	console.log(`${slug}: 240/480/800 webp + 480 jpg`);
}
