<script lang="ts">
	import CloudRain from '@lucide/svelte/icons/cloud-rain';
	import Droplets from '@lucide/svelte/icons/droplets';
	import Sun from '@lucide/svelte/icons/sun';
	import ThermometerSun from '@lucide/svelte/icons/thermometer-sun';
	import Wind from '@lucide/svelte/icons/wind';
	import AlertBanner from '#lib/components/AlertBanner.svelte';
	import DistrictTable from '#lib/components/DistrictTable.svelte';
	import Downloads from '#lib/components/Downloads.svelte';
	import LevelScale from '#lib/components/LevelScale.svelte';
	import Outlook from '#lib/components/Outlook.svelte';
	import TopicPanel from '#lib/components/TopicPanel.svelte';
	import ValueTile from '#lib/components/ValueTile.svelte';
	import { topics } from '#lib/config/topics.ts';
	import { site, topicCopy } from '#lib/copy.ts';
	import { ago, degrees, num, people } from '#lib/format.ts';
	import { tableColumns, topicServices, value } from '#lib/indicators.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const live = $derived(data.live);
	const w = $derived(live.weather?.data);
	const a = $derived(live.air?.data);
	const stale = $derived(Boolean(live.weather?.stale || live.air?.stale));
	const copy = $derived(topicCopy[data.topic]);

	// Keep the current topic in view when the tab row scrolls (narrow screens)
	let tabs = $state<HTMLElement>();
	$effect(() => {
		void data.topic;
		const current = tabs?.querySelector<HTMLElement>('[aria-current]');
		if (tabs && current) {
			const offset = current.getBoundingClientRect().left - tabs.getBoundingClientRect().left;
			tabs.scrollLeft += offset - (tabs.clientWidth - current.offsetWidth) / 2;
		}
	});
</script>

<svelte:head>
	<title>{data.city.name}: {copy.title} — {site.name}</title>
	<meta
		name="description"
		content="Rain, heat, air quality and access to services in {data.city
			.name}, Ghana — live conditions and district figures from open data."
	/>
</svelte:head>

<div class="wrap page">
	<header class="head">
		<h1>{data.city.name}</h1>
		<p class="meta">
			{data.city.region} Region · {people(value(data.indicators.indicators, 'population'))} residents
			in {data.indicators.districts.length}
			{data.indicators.districts.length === 1 ? 'district' : 'districts'} · forecast updated {ago(
				live.weather?.fetchedAt
			)}
		</p>
	</header>

	<div class="layout">
		<section class="now" aria-labelledby="now-title">
			<h2 id="now-title" class="visually-hidden">Conditions now</h2>
			<AlertBanner headline={live.headline} />

			{#if live.unavailable.length}
				<p class="warn" role="status">
					Not available right now: {live.unavailable.join(', ')}. We will try again shortly.
				</p>
			{/if}

			<div class="tiles">
				<ValueTile
					icon={ThermometerSun}
					label="Feels like, max"
					value={degrees(w?.next24h.feelsLikeMax)}
					detail="Now {degrees(w?.temperature)}, feels {degrees(w?.feelsLike)}"
					reading={live.readings.heat}
				/>
				<ValueTile
					icon={CloudRain}
					label="Rain, next 24 h"
					value="{num(w?.next24h.rainTotal, 1)} mm"
					detail="Chance up to {num(w?.next24h.rainProbabilityMax)} %"
					reading={live.readings.rain}
				/>
				<ValueTile
					icon={Wind}
					label="Air, fine dust"
					value="{num(a?.next24h.pm25)} µg/m³"
					detail={live.readings.air?.short ?? 'Not available'}
					reading={live.readings.air}
				/>
				<ValueTile
					icon={Sun}
					label="UV index, max"
					value={num(w?.next24h.uvMax)}
					detail="Sun protection from 3"
				/>
				{#if live.river}
					<div class="wide">
						<ValueTile
							icon={Droplets}
							label={live.river.data.name}
							value="{num(live.river.data.forecastMax)} m³/s"
							detail="Usually {num(live.river.climate.p50)} m³/s"
							reading={live.readings.river}
						/>
					</div>
				{/if}
			</div>
		</section>

		<section class="topic" aria-labelledby="topic-title">
			<h2 id="topic-title" class="visually-hidden">{copy.title}</h2>
			<nav class="tabs" aria-label="Topics" bind:this={tabs}>
				{#each topics as t (t.slug)}
					<a
						href="?topic={t.slug}"
						data-sveltekit-noscroll
						data-sveltekit-replacestate
						aria-current={t.slug === data.topic ? 'page' : undefined}>{t.short}</a
					>
				{/each}
			</nav>
			<TopicPanel
				city={data.city}
				topic={data.topic}
				indicators={data.indicators.indicators}
				districts={data.indicators.districts}
				{live}
				heat={data.heat}
			/>
		</section>

		<section class="later" aria-label="Outlook">
			{#if live.readings.air}
				<LevelScale
					title="Air quality today"
					current={live.readings.air.level}
					steps={{
						calm: 'Good',
						watch: 'Moderate',
						act: 'Unhealthy for some',
						severe: 'Unhealthy'
					}}
				/>
			{/if}
			{#if w}
				<div class="outlook">
					<h3>Next three days</h3>
					<Outlook days={w.days} />
				</div>
			{/if}
			<p class="fresh">
				Forecast {ago(live.weather?.fetchedAt)}{stale
					? ' (source not reachable, showing the last copy)'
					: ''}
				· Open-Meteo, ECMWF and Copernicus CAMS
			</p>
		</section>
	</div>

	<section class="pro" aria-labelledby="pro-title">
		<h2 id="pro-title">For decision-makers: {copy.title.toLowerCase()} by district</h2>
		<p class="pro-lede">
			Sort the table by any column. Figures are for each district as a whole; methods and sources
			are on the <a href="/data">data page</a>.
		</p>
		<DistrictTable
			rows={data.indicators.districts}
			columns={tableColumns[data.topic]}
			caption="{copy.title} figures by district in {data.city.name}"
		/>
		<Downloads
			slug={data.city.slug}
			cityName={data.city.name}
			origin={data.origin}
			layers={topicServices[data.topic].layers}
		/>
	</section>
</div>

<style>
	.page {
		padding-top: var(--s6);
		display: grid;
		gap: var(--s6);
	}
	.head {
		display: grid;
		gap: var(--s1);
	}
	h1 {
		font-size: var(--step-4);
		letter-spacing: -0.025em;
	}
	.meta {
		color: var(--ink-2);
	}
	.layout {
		display: grid;
		gap: var(--s7);
		align-items: start;
	}
	/* Phones: now, topic, outlook (tabs come early). Desktop: now and outlook left, topic right. */
	@media (min-width: 64rem) {
		.layout {
			grid-template-columns: minmax(20rem, 26rem) 1fr;
			grid-template-rows: auto 1fr;
			grid-template-areas: 'now topic' 'later topic';
			gap: var(--s5) var(--s7);
		}
		.now {
			grid-area: now;
		}
		.topic {
			grid-area: topic;
		}
		.later {
			grid-area: later;
		}
	}
	.later {
		display: grid;
		gap: var(--s3);
		align-content: start;
	}
	.now {
		display: grid;
		gap: var(--s4);
	}
	.tiles {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--s3);
	}
	.wide {
		grid-column: 1 / -1;
		display: grid;
	}
	.warn {
		padding: var(--s3) var(--s4);
		border-radius: var(--radius-sm);
		background: var(--watch-wash);
		color: var(--watch);
		font-size: var(--step--1);
	}
	.outlook {
		padding: var(--s4);
		border-radius: var(--radius);
		background: var(--surface);
		box-shadow: var(--shadow);
	}
	.outlook h3 {
		font-size: var(--step-0);
		margin-bottom: var(--s2);
	}
	.fresh {
		color: var(--ink-3);
		font-size: var(--step--1);
	}
	.topic {
		display: grid;
		gap: var(--s5);
		min-width: 0;
	}
	.tabs {
		display: flex;
		gap: var(--s1);
		padding: var(--s1);
		border-radius: 999px;
		background: var(--surface-sunk);
		overflow-x: auto;
		scrollbar-width: none;
		width: fit-content;
		max-width: 100%;
	}
	/* Narrow screens: one scrolling row that fades at the edges; the current tab is centred */
	@media (max-width: 34rem) {
		.tabs {
			width: 100%;
			mask-image: linear-gradient(
				to right,
				transparent,
				#000 1.5rem,
				#000 calc(100% - 1.5rem),
				transparent
			);
		}
	}
	.tabs a {
		padding: var(--s2) var(--s4);
		border-radius: 999px;
		color: var(--ink-2);
		font-weight: 650;
		text-decoration: none;
		white-space: nowrap;
		transition:
			background-color 0.25s var(--ease-out),
			color 0.25s var(--ease-out);
	}
	.tabs a:hover {
		color: var(--ink);
	}
	.tabs a[aria-current='page'] {
		background: var(--surface);
		color: var(--ink);
		box-shadow: var(--shadow);
	}
	.pro {
		display: grid;
		gap: var(--s4);
		padding-top: var(--s6);
		border-top: 1px solid var(--line-strong);
	}
	.pro h2 {
		font-size: var(--step-2);
	}
	.pro-lede {
		color: var(--ink-2);
		max-width: 70ch;
	}
</style>
