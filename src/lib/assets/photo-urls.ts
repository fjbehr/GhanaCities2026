/** Hashed URLs of the city photo variants (built by scripts/build-photos.ts) */
const files = import.meta.glob('./cities/*.{webp,jpg}', {
	eager: true,
	query: '?url',
	import: 'default'
}) as Record<string, string>;

const url = (slug: string, width: number, ext: 'webp' | 'jpg') =>
	files[`./cities/${slug}-${width}.${ext}`];

export function photoSources(slug: string) {
	return {
		webp: [240, 480, 800].map((w) => `${url(slug, w, 'webp')} ${w}w`).join(', '),
		fallback: url(slug, 480, 'jpg')
	};
}
