<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import CityCard from '#lib/components/CityCard.svelte';
	import { site, topicCopy } from '#lib/copy.ts';
	import { ago } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const updated = $derived(
		data.snapshots
			.map((s) => s.updated)
			.filter(Boolean)
			.sort()
			.at(0)
	);
</script>

<svelte:head>
	<title>{site.name} — {site.tagline}</title>
	<meta name="description" content={site.intro} />
</svelte:head>

<section class="wrap intro">
	<h1>{site.tagline}</h1>
	<p class="lede">{site.intro}</p>
</section>

<section class="wrap" aria-labelledby="today">
	<div class="section-head">
		<h2 id="today">Today</h2>
		<p class="meta">
			Forecasts updated {ago(updated)}<span class="long">&nbsp;· {site.notOfficial}</span>
		</p>
	</div>
	<div class="cards">
		{#each data.snapshots as city, i (city.slug)}
			<CityCard {city} eager={i < 2} />
		{/each}
	</div>
</section>

<section class="wrap topics" aria-labelledby="inside">
	<h2 id="inside">What each city page shows</h2>
	<dl>
		{#each Object.values(topicCopy) as t (t.title)}
			<div>
				<dt>{t.title}</dt>
				<dd>{t.summary}</dd>
			</div>
		{/each}
	</dl>
</section>

<section class="wrap pro" aria-labelledby="pro">
	<div>
		<h2 id="pro">For planners, district assemblies and journalists</h2>
		<p>
			Every figure is available per district, with its method and source. Download tables as CSV or
			GeoJSON, or connect your GIS to our WMS and WFS services.
		</p>
	</div>
	<div class="links">
		<a class="button" href="/data">Data, methods and services <ArrowRight size={18} /></a>
		<a class="button secondary" href="/map">Open the full map <ArrowRight size={18} /></a>
	</div>
</section>

<style>
	.intro {
		padding-block: clamp(var(--s5), 4vw, var(--s7)) var(--s6);
		display: grid;
		gap: var(--s4);
	}
	h1 {
		font-size: var(--step-4);
		max-width: 20ch;
		letter-spacing: -0.025em;
	}
	.lede {
		font-size: var(--step-1);
		color: var(--ink-2);
		max-width: 60ch;
	}
	.section-head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--s2) var(--s5);
		margin-bottom: var(--s4);
	}
	.section-head h2 {
		font-size: var(--step-2);
	}
	.meta {
		color: var(--ink-3);
		font-size: var(--step--1);
		max-width: 70ch;
	}
	@media (max-width: 30rem) {
		.intro {
			padding-block: var(--s4) var(--s5);
			gap: var(--s3);
		}
		.section-head {
			margin-bottom: var(--s3);
		}
		h1 {
			font-size: 1.875rem;
		}
		.lede {
			font-size: var(--step-0);
		}
		.long {
			display: none;
		}
	}
	.cards {
		display: grid;
		gap: var(--s4);
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr));
	}
	@media (min-width: 80rem) {
		.cards {
			grid-template-columns: repeat(5, 1fr);
		}
	}
	.topics {
		margin-top: var(--s8);
		display: grid;
		gap: var(--s4);
	}
	.topics h2,
	.pro h2 {
		font-size: var(--step-2);
	}
	.topics dl {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
		gap: var(--s4) var(--s6);
		margin: 0;
	}
	.topics dl div {
		padding-top: var(--s3);
		border-top: 2px solid var(--ink);
	}
	.topics dt {
		font-weight: 700;
		font-size: var(--step-1);
	}
	.topics dd {
		margin: var(--s1) 0 0;
		color: var(--ink-2);
	}
	.pro {
		margin-top: var(--s8);
		display: grid;
		gap: var(--s5);
		padding: var(--s6) var(--s5);
		border-radius: var(--radius);
		background: var(--surface);
		box-shadow: var(--shadow);
	}
	.pro p {
		margin-top: var(--s3);
		color: var(--ink-2);
		max-width: 62ch;
	}
	.links {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s3);
		align-items: center;
	}
	@media (min-width: 60rem) {
		.pro {
			grid-template-columns: 1fr auto;
			align-items: center;
			padding: var(--s6) var(--s7);
		}
	}
	.button {
		display: inline-flex;
		align-items: center;
		gap: var(--s2);
		padding: var(--s3) var(--s5);
		border-radius: 999px;
		background: var(--accent);
		color: var(--ink-on-accent);
		font-weight: 650;
		text-decoration: none;
		transition: background-color 0.2s var(--ease-out);
	}
	.button:hover {
		background: var(--accent-hover);
		color: var(--ink-on-accent);
	}
	.button.secondary {
		background: var(--accent-wash);
		color: var(--accent);
	}
	.button.secondary:hover {
		background: var(--accent-wash-hover);
		color: var(--accent-hover);
	}
</style>
