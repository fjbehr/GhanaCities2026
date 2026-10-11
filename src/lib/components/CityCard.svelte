<script lang="ts">
	import CloudRain from '@lucide/svelte/icons/cloud-rain';
	import ThermometerSun from '@lucide/svelte/icons/thermometer-sun';
	import Wind from '@lucide/svelte/icons/wind';
	import { photos, photoSrc } from '#lib/config/photos.ts';
	import { degrees, num } from '#lib/format.ts';
	import type { Snapshot } from '#lib/server/live.ts';
	import LevelBadge from './LevelBadge.svelte';

	let { city, eager = false }: { city: Snapshot; eager?: boolean } = $props();
	const photo = $derived(photos[city.slug]);
</script>

<article class="card">
	<figure>
		<img
			src={photoSrc(city.slug, 400)}
			srcset="{photoSrc(city.slug, 400)} 400w, {photoSrc(city.slug, 800)} 800w"
			sizes="(min-width: 60rem) 24rem, (min-width: 40rem) 50vw, 100vw"
			alt={photo.alt}
			width="400"
			height={Math.round(400 / photo.ratio)}
			loading={eager ? 'eager' : 'lazy'}
			decoding="async"
		/>
		<figcaption>
			Photo: <a href={photo.source} rel="external">{photo.author}</a>,
			<a href={photo.licenseUrl} rel="external license">{photo.license}</a>
		</figcaption>
	</figure>
	<div class="body">
		<h2><a href="/city/{city.slug}">{city.name}</a></h2>
		<p class="region">{city.region} Region</p>
		<div class="status">
			<LevelBadge
				level={city.headline.level}
				label={city.headline.topic === 'air' ? `Air: ${city.headline.short}` : city.headline.label}
			/>
		</div>
		<dl>
			<div>
				<dt><ThermometerSun size={16} aria-hidden="true" />Feels like, max</dt>
				<dd>{degrees(city.feelsLikeMax)}</dd>
			</div>
			<div>
				<dt><CloudRain size={16} aria-hidden="true" />Rain, next 24 h</dt>
				<dd>{num(city.rainNext24h, 1)} mm</dd>
			</div>
			<div>
				<dt><Wind size={16} aria-hidden="true" />Air</dt>
				<dd>{city.air?.short ?? 'Not available'}</dd>
			</div>
		</dl>
		<p class="credit">
			Photo: <a href={photo.source} rel="external">{photo.author}</a>,
			<a href={photo.licenseUrl} rel="external license">{photo.license}</a>
		</p>
	</div>
</article>

<style>
	.card {
		position: relative;
		display: grid;
		grid-template-rows: auto 1fr;
		background: var(--surface);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		overflow: hidden;
		transition:
			box-shadow 0.3s var(--ease-out),
			transform 0.3s var(--ease-out);
	}
	.card:has(h2 a:hover) {
		box-shadow: var(--shadow-raised);
		transform: translateY(-2px);
	}
	figure {
		margin: 0;
		position: relative;
		aspect-ratio: 3 / 2;
		background: var(--surface-sunk);
	}
	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	figcaption {
		position: absolute;
		inset: auto 0 0 auto;
		z-index: 2;
		padding: 0.15rem 0.5rem;
		background: rgb(15 23 42 / 0.66);
		color: #fff;
		font-size: 0.6875rem;
		border-top-left-radius: var(--radius-sm);
	}
	figcaption a {
		color: inherit;
	}
	.body {
		display: grid;
		align-content: start;
		gap: var(--s3);
		padding: var(--s4) var(--s4) var(--s5);
	}
	h2 {
		font-size: var(--step-2);
	}
	h2 a {
		color: var(--ink);
		text-decoration: none;
	}
	/* The whole card is the link target; the photo credit stays clickable above it */
	h2 a::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 1;
	}
	h2 a:focus-visible {
		outline: none;
	}
	.card:has(h2 a:focus-visible) {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}
	.region {
		margin-top: calc(-1 * var(--s2));
		color: var(--ink-3);
		font-size: var(--step--1);
	}
	dl {
		display: grid;
		gap: var(--s2);
		margin: 0;
		padding-top: var(--s3);
		border-top: 1px solid var(--line);
	}
	dl div {
		display: flex;
		justify-content: space-between;
		gap: var(--s3);
		font-size: var(--step--1);
	}
	dt {
		display: inline-flex;
		align-items: center;
		gap: var(--s2);
		color: var(--ink-2);
	}
	dt :global(svg) {
		color: var(--ink-3);
	}
	dd {
		margin: 0;
		font-weight: 650;
		text-align: right;
	}
	.credit {
		display: none;
		position: relative;
		z-index: 2;
		color: var(--ink-3);
		font-size: 0.6875rem;
	}
	.credit a {
		color: inherit;
	}
	/* Phones: photo as a thumbnail beside the figures, so two cities fit the first screen */
	@media (max-width: 39.99rem) {
		.card {
			grid-template-columns: 6.5rem 1fr;
			grid-template-rows: none;
		}
		figure {
			aspect-ratio: auto;
			height: 100%;
		}
		figcaption {
			display: none;
		}
		.credit {
			display: block;
		}
		.body {
			gap: var(--s2);
			padding: var(--s3) var(--s4) var(--s3) var(--s3);
		}
		h2 {
			font-size: var(--step-1);
		}
		.region {
			display: none;
		}
		dl {
			padding-top: var(--s2);
			gap: var(--s1);
		}
	}
</style>
