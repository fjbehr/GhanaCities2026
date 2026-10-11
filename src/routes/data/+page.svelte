<script lang="ts">
	import { page } from '$app/state';
	import { cities } from '#lib/config/cities.ts';
	import { photos } from '#lib/config/photos.ts';
	import { sources } from '#lib/config/sources.ts';
	import { limitations, site, topicCopy } from '#lib/copy.ts';
	import { AIR, HEAT, RAIN } from '#lib/levels.ts';

	const origin = $derived(page.url.origin);
	const sections = [
		['sources', 'Sources and licences'],
		['levels', 'How we rate conditions'],
		['methods', 'Methods'],
		['limits', 'Limits of the data'],
		['services', 'Services, API and downloads'],
		['photos', 'Photos']
	];
</script>

<svelte:head>
	<title>Data, sources and methods — {site.name}</title>
	<meta
		name="description"
		content="Where every figure on Ghana Cities comes from, how it is calculated, and how to reuse it."
	/>
</svelte:head>

<article class="wrap doc">
	<header>
		<h1>Data, sources and methods</h1>
		<p class="lede">
			Everything on this site comes from free, open data. Here is where each figure comes from, how
			we calculate it, what it cannot tell you, and how to reuse it.
		</p>
		<nav aria-label="On this page">
			<ol>
				{#each sections as [id, title] (id)}
					<li><a href="#{id}">{title}</a></li>
				{/each}
			</ol>
		</nav>
	</header>

	<section id="sources">
		<h2>Sources and licences</h2>
		<div class="scroll" role="region" aria-label="Sources" tabindex="-1">
			<table>
				<thead>
					<tr
						><th scope="col">Data</th><th scope="col">Provider</th><th scope="col">Used for</th><th
							scope="col">Licence</th
						><th scope="col">Updated</th></tr
					>
				</thead>
				<tbody>
					{#each sources as s (s.name)}
						<tr>
							<th scope="row"><a href={s.url} rel="external">{s.name}</a></th>
							<td>
								{s.provider}
								{#if s.credit}<span class="credit">{s.credit}</span>{/if}
							</td>
							<td>{s.usedFor}</td>
							<td><a href={s.licenceUrl} rel="external license">{s.licence}</a></td>
							<td>{s.updated}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section id="levels">
		<h2>How we rate conditions</h2>
		<p>
			Each city page rates rain, heat, air and — for Accra — the Densu river with fixed thresholds.
			{site.notOfficial}
		</p>
		<dl class="levels">
			<div>
				<dt>Rain, next 24 hours</dt>
				<dd>
					<strong>Rain expected</strong> from {RAIN.watch} mm. <strong>Heavy rain likely</strong>
					from
					{RAIN.act} mm, or when a single hour brings {RAIN.intenseHour} mm or more — enough to overflow
					open drains. <strong>Very heavy rain</strong> from {RAIN.severe} mm.
				</dd>
			</div>
			<div>
				<dt>Heat, highest feels-like temperature</dt>
				<dd>
					Feels-like values of 32–39 °C are ordinary in Ghana, so we rate from the US National
					Weather Service’s “danger” band: <strong>Very hot</strong> from {HEAT.watch} °C,
					<strong>Dangerous heat</strong> from {HEAT.act} °C, <strong>Extreme heat</strong> from
					{HEAT.severe} °C.
				</dd>
			</div>
			<div>
				<dt>Air, average of the next 24 hours</dt>
				<dd>
					US EPA air quality breakpoints (2024), as used by IQAir. Fine dust (PM2.5): moderate from
					{AIR.pm25.watch}, unhealthy for sensitive groups from {AIR.pm25.act}, unhealthy from
					{AIR.pm25.severe} µg/m³. Coarse dust (PM10): from {AIR.pm10.watch}, {AIR.pm10.act} and
					{AIR.pm10.severe} µg/m³. The worse of the two decides. When most of the dust is mineral dust,
					we name the Harmattan.
				</dd>
			</div>
			<div>
				<dt>River</dt>
				<dd>
					The highest forecast flow of the coming week against the same river cell over the last two
					years: <strong>higher than usual</strong> above the level reached on one day in ten,
					<strong>very high</strong> above one day in a hundred.
				</dd>
			</div>
		</dl>
	</section>

	<section id="methods">
		<h2>Methods</h2>
		<dl class="methods">
			<div>
				<dt>Which districts belong to a city</dt>
				<dd>
					A district (MMDA) counts when it lies in the city’s region and either contains the city
					centre or lies mostly inside the built-up metropolitan area.
				</dd>
			</div>
			<div>
				<dt>Access to clinics, schools and markets</dt>
				<dd>
					For every 100 m cell with residents (WorldPop 2025) we measure the straight-line distance
					to the nearest facility mapped in OpenStreetMap, then add up the residents within 2 km and
					5 km. Real walking routes are longer.
				</dd>
			</div>
			<div>
				<dt>Low-lying areas</dt>
				<dd>
					A 30 m cell counts as low-lying when it lies at least 5 m below the average height of its
					surroundings within about 500 m — valley bottoms and hollows where rainwater runs
					together.
				</dd>
			</div>
			<div>
				<dt>Surface heat</dt>
				<dd>
					Landsat 8 and 9 images from two dry seasons (December–March), with clouds and their
					shadows removed pixel by pixel. For each place we take the median temperature of all clear
					images, then compare it with the city’s median.
				</dd>
			</div>
			<div>
				<dt>Rain normals</dt>
				<dd>
					Long-term monthly averages (CHPclim) against the last twelve months (CHIRPS), averaged
					over each city’s area.
				</dd>
			</div>
		</dl>
		<p class="small">
			Every figure is produced by a scripted pipeline that can be re-run from the raw data, so
			results can be checked and updated.
		</p>
	</section>

	<section id="limits">
		<h2>Limits of the data</h2>
		<dl class="methods">
			{#each Object.entries(limitations) as [topic, text] (topic)}
				<div>
					<dt>{topicCopy[topic as keyof typeof topicCopy].title}</dt>
					<dd>{text}</dd>
				</div>
			{/each}
			<div>
				<dt>District boundaries</dt>
				<dd>
					The boundaries date from 2019. Districts created or split since then, such as parts of the
					Accra Metropolis, may not match today’s assemblies.
				</dd>
			</div>
		</dl>
	</section>

	<section id="services">
		<h2>Services, API and downloads</h2>
		<p>
			Use these in QGIS, ArcGIS or your own code. All layers are in the workspace <code>ghana</code
			>.
		</p>
		<ul class="endpoints">
			<li>
				<span>WMS</span><code
					>{origin}/geoserver/ghana/wms?service=WMS&amp;request=GetCapabilities</code
				>
			</li>
			<li>
				<span>WFS</span><code
					>{origin}/geoserver/ghana/wfs?service=WFS&amp;request=GetCapabilities</code
				>
			</li>
			<li>
				<span>WMTS</span><code
					>{origin}/geoserver/ghana/gwc/service/wmts?request=GetCapabilities</code
				>
			</li>
			<li>
				<span>API</span><code>{origin}/api/cities</code> · <code>/api/cities/accra/live</code> ·
				<code>/api/cities/accra/indicators</code>
			</li>
			<li><span>Fires</span><code>{origin}/api/layers/fires.geojson</code></li>
		</ul>
		<h3>Downloads by city</h3>
		<ul class="downloads">
			{#each cities as c (c.slug)}
				<li>
					<strong>{c.name}</strong>
					<a href="/api/export/{c.slug}/districts.csv" download>Districts (CSV)</a>
					<a href="/api/export/{c.slug}/districts.geojson" download>Districts (GeoJSON)</a>
					<a href="/api/export/{c.slug}/facilities.geojson" download>Facilities (GeoJSON)</a>
				</li>
			{/each}
		</ul>
	</section>

	<section id="photos">
		<h2>Photos</h2>
		<ul class="photos">
			{#each cities as c (c.slug)}
				{@const p = photos[c.slug]}
				<li>
					{c.name}: <a href={p.source} rel="external">{p.alt}</a> by {p.author},
					<a href={p.licenseUrl} rel="external license">{p.license}</a>, via Wikimedia Commons.
				</li>
			{/each}
		</ul>
	</section>
</article>

<style>
	.doc {
		padding-top: var(--s7);
		display: grid;
		gap: var(--s7);
	}
	header {
		display: grid;
		gap: var(--s4);
	}
	h1 {
		font-size: var(--step-4);
		letter-spacing: -0.025em;
	}
	.lede {
		font-size: var(--step-1);
		color: var(--ink-2);
		max-width: 62ch;
	}
	nav ol {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s2) var(--s4);
		margin: 0;
		padding: 0;
		list-style: none;
		font-weight: 600;
	}
	section {
		display: grid;
		gap: var(--s4);
		scroll-margin-top: var(--s5);
	}
	h2 {
		font-size: var(--step-3);
		letter-spacing: -0.02em;
	}
	h3 {
		font-size: var(--step-1);
		margin-top: var(--s4);
	}
	section > p {
		max-width: 70ch;
	}
	.scroll {
		overflow-x: auto;
		border-radius: var(--radius);
		background: var(--surface);
		box-shadow: var(--shadow);
	}
	table {
		width: 100%;
		font-size: var(--step--1);
	}
	th,
	td {
		padding: var(--s3);
		border-bottom: 1px solid var(--line);
		text-align: left;
		vertical-align: top;
	}
	thead th {
		color: var(--ink-2);
		border-bottom-color: var(--line-strong);
	}
	tbody tr:last-child > * {
		border-bottom: 0;
	}
	tbody th {
		min-width: 11rem;
	}
	dl {
		display: grid;
		gap: var(--s4);
		margin: 0;
		max-width: 75ch;
	}
	dl div {
		padding-bottom: var(--s4);
		border-bottom: 1px solid var(--line);
	}
	dt {
		font-weight: 700;
		margin-bottom: var(--s1);
	}
	dd {
		margin: 0;
		color: var(--ink-2);
	}
	dd strong {
		color: var(--ink);
	}
	.credit {
		display: block;
		margin-top: var(--s1);
		color: var(--ink-3);
		font-size: 0.75rem;
		font-style: italic;
	}
	.small {
		color: var(--ink-3);
		font-size: var(--step--1);
	}
	code {
		font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace;
		font-size: 0.8125rem;
		overflow-wrap: anywhere;
	}
	.endpoints,
	.downloads,
	.photos {
		display: grid;
		gap: var(--s2);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.endpoints li {
		display: grid;
		grid-template-columns: 4rem 1fr;
		gap: var(--s3);
		padding: var(--s3);
		background: var(--surface);
		border-radius: var(--radius-sm);
		box-shadow: inset 0 0 0 1px var(--line);
	}
	.endpoints span {
		font-weight: 700;
		font-size: var(--step--1);
	}
	.downloads li {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s2) var(--s4);
		align-items: baseline;
	}
	.downloads strong {
		min-width: 9rem;
	}
	.photos {
		color: var(--ink-2);
		font-size: var(--step--1);
		max-width: 80ch;
	}
</style>
