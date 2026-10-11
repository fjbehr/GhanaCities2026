<script lang="ts">
	import Map from '@lucide/svelte/icons/map';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import type { City } from '#lib/config/cities.ts';
	import { portalUrl } from '#lib/config/map.ts';
	import { legends } from '#lib/config/legends.ts';
	import type { TopicSlug } from '#lib/config/topics.ts';

	let {
		city,
		topic,
		group,
		title
	}: { city: City; topic: TopicSlug; group: string; title: string } = $props();

	let interactive = $state(false);

	/** EPSG:4326 → EPSG:3857 */
	const merc = (lon: number, lat: number) => [
		(6378137 * lon * Math.PI) / 180,
		6378137 * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))
	];

	/** Static preview of the topic's layers from GeoServer (cached by GeoWebCache) */
	const preview = $derived.by(() => (width: number) => {
		const [w, s, e, n] = city.bbox;
		const [x0, y0] = merc(w, s);
		const [x1, y1] = merc(e, n);
		// Pad to the 16:10 frame so the picture is not stretched
		const cx = (x0 + x1) / 2;
		const cy = (y0 + y1) / 2;
		const half = Math.max((x1 - x0) / 2, ((y1 - y0) / 2) * 1.6);
		const bbox = [cx - half, cy - half / 1.6, cx + half, cy + half / 1.6].map(Math.round).join(',');
		const params = new URLSearchParams({
			service: 'WMS',
			version: '1.3.0',
			request: 'GetMap',
			layers: group,
			styles: '',
			crs: 'EPSG:3857',
			bbox,
			width: String(width),
			height: String((width * 5) / 8),
			format: 'image/png',
			transparent: 'false',
			bgcolor: '0xE9EEF3'
		});
		return `/geoserver/ghana/wms?${params}`;
	});
	const full = $derived(`/map?city=${city.slug}&topic=${topic}`);
</script>

<div class="panel">
	{#if interactive}
		<iframe src={portalUrl(city, topic)} {title} loading="lazy" allow="geolocation; fullscreen"
		></iframe>
	{:else}
		<img
			src={preview(800)}
			srcset="{preview(480)} 480w, {preview(800)} 800w"
			sizes="(min-width: 64rem) 50rem, 100vw"
			alt="Preview of the {title.toLowerCase()} for {city.name}"
			width="800"
			height="500"
			loading="lazy"
		/>
		<div class="cover">
			<button type="button" onclick={() => (interactive = true)}>
				<Map size={18} aria-hidden="true" />
				Load interactive map
			</button>
		</div>
	{/if}
</div>
<ul class="legend" aria-label="Legend">
	{#each legends[topic] as item (item.label)}
		<li>
			<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
				{#if item.kind === 'fill'}
					<rect x="1" y="3" width="14" height="10" rx="2" fill={item.color} />
				{:else if item.kind === 'line'}
					<rect
						x="1"
						y="3"
						width="14"
						height="10"
						rx="2"
						fill="none"
						stroke={item.color}
						stroke-width="1.5"
					/>
				{:else if item.kind === 'cross'}
					<path
						d="M6 2h4v4h4v4h-4v4H6v-4H2V6h4z"
						fill={item.color}
						stroke="#fff"
						stroke-width="1"
					/>
				{:else if item.kind === 'triangle'}
					<path d="M8 2l6.5 12h-13z" fill={item.color} stroke="#fff" stroke-width="1" />
				{:else}
					<rect
						x="2.5"
						y="2.5"
						width="11"
						height="11"
						fill={item.color}
						stroke="#fff"
						stroke-width="1"
					/>
				{/if}
			</svg>
			{item.label}
		</li>
	{/each}
</ul>
<p class="below">
	<a href={full}>Open full-screen map <ExternalLink size={14} aria-hidden="true" /></a>
	<span
		>The interactive map loads about 5 MB the first time; it adds the street map, satellite image
		and all layers.</span
	>
</p>

<style>
	.panel {
		position: relative;
		aspect-ratio: 16 / 10;
		border-radius: var(--radius);
		overflow: hidden;
		background: var(--surface-sunk);
		box-shadow: inset 0 0 0 1px var(--line);
	}
	img,
	iframe {
		width: 100%;
		height: 100%;
		border: 0;
		object-fit: cover;
	}
	.cover {
		position: absolute;
		inset: auto 0 0 0;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--s2) var(--s3);
		padding: var(--s4);
		background: linear-gradient(to top, rgb(15 23 42 / 0.12), transparent);
	}
	button {
		display: inline-flex;
		align-items: center;
		gap: var(--s2);
		padding: var(--s3) var(--s4);
		border: 0;
		border-radius: 999px;
		background: var(--surface);
		color: var(--ink);
		font-weight: 650;
		cursor: pointer;
		box-shadow: var(--shadow-raised);
		transition: transform 0.2s var(--ease-out);
	}
	button:hover {
		transform: translateY(-1px);
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s1) var(--s4);
		margin: var(--s3) 0 0;
		padding: 0;
		list-style: none;
		font-size: var(--step--1);
		color: var(--ink-2);
	}
	.legend li {
		display: inline-flex;
		align-items: center;
		gap: var(--s2);
	}
	.legend svg {
		flex: none;
	}
	.below {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s1) var(--s3);
		margin-top: var(--s2);
		font-size: var(--step--1);
		color: var(--ink-3);
	}
	.below a {
		display: inline-flex;
		align-items: center;
		gap: var(--s1);
		font-weight: 600;
	}
</style>
