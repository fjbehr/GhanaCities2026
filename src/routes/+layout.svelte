<script lang="ts">
	import '@fontsource-variable/atkinson-hyperlegible-next/wght.css';
	import '../app.css';
	import { page } from '$app/state';
	import { cities } from '#lib/config/cities.ts';
	import { site } from '#lib/copy.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const isCurrent = (href: string) =>
		page.url.pathname === href || page.url.pathname.startsWith(href + '/');
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
	<meta name="theme-color" content="#ffffff" />
</svelte:head>

<a class="skip" href="#main">Skip to content</a>

<header class="site">
	<div class="wrap head">
		<a class="brand" href="/" aria-current={page.url.pathname === '/' ? 'page' : undefined}>
			<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
				<circle cx="12" cy="12" r="10.5" fill="var(--accent)" />
				<path
					d="M6.5 14.5c1.6-2.3 3.2-3.4 5-3.4s3.4 1.1 6 3.4M8 9.5c1.2-1.2 2.5-1.8 4-1.8"
					fill="none"
					stroke="#fff"
					stroke-width="1.8"
					stroke-linecap="round"
				/>
			</svg>
			{site.name}
		</a>
		<nav class="tools" aria-label="Site">
			<a href="/map" aria-current={isCurrent('/map') ? 'page' : undefined}>Map</a>
			<a href="/data" aria-current={isCurrent('/data') ? 'page' : undefined}>Data</a>
			<a href="/about" aria-current={isCurrent('/about') ? 'page' : undefined}>About</a>
		</nav>
		<nav class="cities" aria-label="Cities">
			{#each cities as c (c.slug)}
				<a href="/city/{c.slug}" aria-current={isCurrent(`/city/${c.slug}`) ? 'page' : undefined}
					>{c.name}</a
				>
			{/each}
		</nav>
	</div>
</header>

<main id="main">
	{@render children()}
</main>

{#if page.url.pathname !== '/map'}
	<footer class="site">
		<div class="wrap foot">
			<p class="notice">{site.notOfficial}</p>
			<p>
				Data: © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors,
				<a href="https://open-meteo.com">Weather data by Open-Meteo.com</a> (CC BY 4.0), Copernicus,
				NASA, WorldPop, ESA, JRC, USGS and geoBoundaries.
				<a href="/data">Sources, licences and methods</a>.
			</p>
			<p>Non-commercial, built with open-source software and open data.</p>
		</div>
	</footer>
{/if}

<style>
	.skip {
		position: absolute;
		left: var(--s4);
		top: -3rem;
		padding: var(--s2) var(--s4);
		background: var(--ink);
		color: #fff;
		border-radius: var(--radius-sm);
		z-index: 10;
	}
	.skip:focus {
		top: var(--s2);
	}
	header.site {
		background: var(--surface);
		border-bottom: 1px solid var(--line);
	}
	.head {
		display: grid;
		grid-template-columns: 1fr auto;
		grid-template-areas: 'brand tools' 'cities cities';
		align-items: center;
		column-gap: var(--s4);
		padding-top: var(--s3);
	}
	.brand {
		grid-area: brand;
		display: inline-flex;
		align-items: center;
		gap: var(--s2);
		color: var(--ink);
		font-weight: 750;
		font-size: var(--step-1);
		letter-spacing: -0.015em;
		text-decoration: none;
		justify-self: start;
	}
	.tools {
		grid-area: tools;
		display: flex;
		gap: var(--s1);
	}
	.cities {
		grid-area: cities;
		display: flex;
		gap: var(--s1);
		padding-block: var(--s2);
		overflow-x: auto;
		scrollbar-width: none;
		/* Fade at the right edge: more cities to scroll to */
		mask-image: linear-gradient(to right, #000 85%, transparent);
	}
	nav a {
		/* 44 px touch target */
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		color: var(--ink-2);
		font-weight: 600;
		text-decoration: none;
		padding: var(--s2) var(--s3);
		border-radius: 999px;
		white-space: nowrap;
		transition: background-color 0.2s var(--ease-out);
	}
	nav a:hover {
		color: var(--ink);
		background: var(--surface-sunk);
	}
	nav a[aria-current='page'] {
		color: var(--accent);
		background: var(--accent-wash);
	}
	@media (min-width: 60rem) {
		.head {
			grid-template-columns: auto 1fr auto;
			grid-template-areas: 'brand cities tools';
			column-gap: var(--s5);
			padding-block: var(--s3);
		}
		.cities {
			padding: 0;
			mask-image: none;
		}
	}
	footer.site {
		margin-top: var(--s8);
		border-top: 1px solid var(--line);
		background: var(--surface);
		color: var(--ink-2);
		font-size: var(--step--1);
	}
	.foot {
		display: grid;
		gap: var(--s2);
		padding-block: var(--s6);
		max-width: var(--page);
	}
	.foot p {
		max-width: 75ch;
	}
	.notice {
		color: var(--ink);
		font-weight: 600;
	}
</style>
