<script lang="ts">
	import type { City } from '#lib/config/cities.ts';
	import type { TopicSlug } from '#lib/config/topics.ts';
	import { cityNotes, limitations, meaning, topicCopy } from '#lib/copy.ts';
	import { degrees, monthName, num, pct } from '#lib/format.ts';
	import {
		extreme,
		series,
		topicServices,
		value,
		type DistrictRow,
		type Series
	} from '#lib/indicators.ts';
	import type { Live } from '#lib/server/live.ts';
	import BarList from './charts/BarList.svelte';
	import ColumnChart from './charts/ColumnChart.svelte';
	import MapPanel from './MapPanel.svelte';

	let {
		city,
		topic,
		indicators,
		districts,
		live,
		heat
	}: {
		city: City;
		topic: TopicSlug;
		indicators: Series[];
		districts: DistrictRow[];
		live: Live;
		heat: { median: number; scenes: string[] } | null;
	} = $props();

	const copy = $derived(topicCopy[topic]);
	const note = $derived(cityNotes[city.slug]?.[topic]);
	const manyDistricts = $derived(districts.length >= 3);

	/** Last 12 months of rain against the long-term monthly normal */
	const rain = $derived.by(() => {
		const recent = series(indicators, 'rain_month_mm')?.values ?? [];
		const normal = series(indicators, 'rain_normal_mm')?.values ?? [];
		return recent.slice(-12).map((m) => ({
			label: monthName(m.period),
			value: m.value,
			ref: normal.find((n) => n.period === m.period.slice(5))?.value ?? null
		}));
	});

	const growth = $derived(
		(series(indicators, 'built_up_km2')?.values ?? []).map((v) => ({
			label: v.period,
			value: v.value,
			note: v.period === '2030' ? 'projection' : undefined
		}))
	);

	const landCover = $derived(
		[
			['built', 'Built-up'],
			['tree', 'Trees'],
			['cropland', 'Cropland'],
			['grass', 'Grassland'],
			['shrub', 'Shrubs'],
			['water', 'Water'],
			['wetland', 'Wetland'],
			['bare', 'Bare ground']
		]
			.map(([k, label]) => ({ label, value: value(indicators, `landcover_${k}`) }))
			.filter((r) => (r.value ?? 0) >= 0.5)
			.sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
	);

	const byDistrict = (column: string) =>
		districts
			.map((d) => ({ label: String(d.name), value: d[column] as number | null }))
			.sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));
</script>

<div class="panel">
	<p class="summary">{copy.summary}</p>

	<MapPanel {city} {topic} group={topicServices[topic].group} title="{copy.title} map" />

	<ul class="findings">
		{#if topic === 'flood'}
			<li>
				<strong>{pct(value(indicators, 'pop_low_lying'))}</strong>
				<p>{meaning.lowLying(value(indicators, 'pop_low_lying'), city.name)}</p>
			</li>
			{#if live.river}
				<li>
					<strong>{num(live.river.data.forecastMax, 0)} m³/s</strong>
					<p>
						Highest flow expected on the {live.river.data.name} in the next week. Usually it carries about
						{num(live.river.climate.p50, 0)} m³/s; only one day in ten brings more than {num(
							live.river.climate.p90,
							0
						)} m³/s.
					</p>
				</li>
			{/if}
		{:else if topic === 'heat-air'}
			{#if heat}
				<li>
					<strong>{degrees(heat.median)}</strong>
					<p>
						Typical ground temperature in {city.name} on a clear dry-season morning (about 10:30), from
						{heat.scenes.length} Landsat images. Roofs and bare ground get far hotter than the air.
					</p>
				</li>
			{/if}
			{#if manyDistricts}
				<li class="text">
					<p>
						{meaning.heatSpread(
							extreme(districts, 'heat_vs_city_c', 'max'),
							extreme(districts, 'heat_vs_city_c', 'min')
						)}
					</p>
				</li>
			{/if}
			{#if live.air}
				<li>
					<strong>{num(live.air.data.next24h.pm25, 0)} µg/m³</strong>
					<p>
						Fine dust (PM2.5) expected on average over the next 24 hours. {live.readings.air
							?.label}.
						{#if live.air.data.dustShare >= 0.5}Most of the coarse dust is Saharan dust.{/if}
						From December to March the Harmattan wind can carry far more.
					</p>
				</li>
			{/if}
		{:else if topic === 'services'}
			<li>
				<strong>{pct(value(indicators, 'pop_within_2km_health'))}</strong>
				<p>
					{meaning.healthAccess(
						value(indicators, 'pop_within_2km_health'),
						value(indicators, 'pop_within_5km_health')
					)}
				</p>
			</li>
			<li>
				<strong>{pct(value(indicators, 'pop_within_2km_school'))}</strong>
				<p>
					of residents live within 2 km of a school, {pct(
						value(indicators, 'pop_within_2km_market')
					)} within 2 km of a market.
				</p>
			</li>
			<li class="text">
				<p>{meaning.population(value(indicators, 'population'), districts.length)}</p>
			</li>
		{:else}
			<li>
				<strong>{num(value(indicators, 'built_up_km2', '2020'))} km²</strong>
				<p>
					{meaning.growth(
						value(indicators, 'built_up_km2', '1975'),
						value(indicators, 'built_up_km2', '2020'),
						city.name
					)}
				</p>
			</li>
			<li>
				<strong>{pct(value(indicators, 'landcover_tree'))}</strong>
				<p>of the land is covered by trees (2021). Trees shade streets and soak up rain.</p>
			</li>
		{/if}
	</ul>

	{#if note}<p class="note">{note}</p>{/if}

	<div class="chart">
		{#if topic === 'flood' && rain.length}
			<ColumnChart
				title="Rain per month in {city.name}"
				columns={rain}
				unit="mm"
				seriesLabel="Last 12 months"
				refLabel="Long-term normal"
			/>
		{:else if topic === 'heat-air' && manyDistricts}
			<BarList
				title="Ground temperature against the city average, by district"
				rows={byDistrict('heat_vs_city_c')}
				unit="°C"
				digits={1}
				diverging
				positiveLabel="Hotter"
				negativeLabel="Cooler"
			/>
		{:else if topic === 'services' && manyDistricts}
			<BarList
				title="Residents within 2 km of a health facility, by district"
				rows={byDistrict('health_2km_pct')}
				unit="%"
				max={100}
			/>
		{:else if topic === 'environment'}
			<ColumnChart
				title="Built-up area of {city.name}"
				columns={growth}
				unit="km²"
				seriesLabel="Built-up area"
			/>
			<BarList title="What covers the land (2021)" rows={landCover} unit="%" max={100} />
		{/if}
	</div>

	<p class="limits"><strong>Limits of the data.</strong> {limitations[topic]}</p>
</div>

<style>
	.panel {
		display: grid;
		gap: var(--s5);
		min-width: 0;
	}
	.summary {
		color: var(--ink-2);
		font-size: var(--step-1);
	}
	.findings {
		display: grid;
		gap: var(--s4);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.findings li {
		display: grid;
		grid-template-columns: minmax(6.5rem, auto) 1fr;
		gap: var(--s4);
		align-items: baseline;
		padding-bottom: var(--s4);
		border-bottom: 1px solid var(--line);
	}
	.findings li.text {
		grid-template-columns: 1fr;
	}
	.findings strong {
		font-size: var(--step-3);
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1;
		white-space: nowrap;
	}
	.findings p {
		max-width: 62ch;
	}
	.note {
		padding: var(--s4) var(--s5);
		border-radius: var(--radius);
		background: var(--accent-wash);
		max-width: 70ch;
	}
	.chart {
		display: grid;
		gap: var(--s6);
		min-width: 0;
		padding: var(--s5);
		border-radius: var(--radius);
		background: var(--surface);
		box-shadow: var(--shadow);
	}
	.chart:empty {
		display: none;
	}
	.limits {
		color: var(--ink-2);
		font-size: var(--step--1);
		max-width: 75ch;
	}
	@media (max-width: 30rem) {
		.findings li {
			grid-template-columns: 1fr;
			gap: var(--s2);
		}
	}
</style>
