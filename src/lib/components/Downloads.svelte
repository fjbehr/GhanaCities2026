<script lang="ts">
	import Download from '@lucide/svelte/icons/download';
	import Copy from '@lucide/svelte/icons/copy';
	import Check from '@lucide/svelte/icons/check';

	let {
		slug,
		cityName,
		origin,
		layers
	}: { slug: string; cityName: string; origin: string; layers: string[] } = $props();

	const services = $derived([
		{ name: 'WMS', url: `${origin}/geoserver/ghana/wms?service=WMS&request=GetCapabilities` },
		{ name: 'WFS', url: `${origin}/geoserver/ghana/wfs?service=WFS&request=GetCapabilities` }
	]);
	let copied = $state<string | null>(null);

	async function copy(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			copied = text;
			setTimeout(() => (copied = null), 2000);
		} catch {
			copied = null;
		}
	}
</script>

<div class="grid">
	<section aria-labelledby="dl-title">
		<h3 id="dl-title">Download {cityName}</h3>
		<ul class="files">
			<li>
				<a href="/api/export/{slug}/districts.csv" download>
					<Download size={16} aria-hidden="true" />Districts with all figures (CSV)</a
				>
			</li>
			<li>
				<a href="/api/export/{slug}/districts.geojson" download>
					<Download size={16} aria-hidden="true" />Districts with boundaries (GeoJSON)</a
				>
			</li>
			<li>
				<a href="/api/export/{slug}/facilities.geojson" download>
					<Download size={16} aria-hidden="true" />Clinics, schools, markets, water points (GeoJSON)</a
				>
			</li>
		</ul>
	</section>
	<section aria-labelledby="ogc-title">
		<h3 id="ogc-title">Use in your GIS</h3>
		<p class="note">
			Add these services in QGIS or ArcGIS. Layers for this topic: {layers.join(', ')}.
		</p>
		<ul class="services">
			{#each services as s (s.name)}
				<li>
					<span class="kind">{s.name}</span>
					<code>{s.url}</code>
					<button type="button" onclick={() => copy(s.url)} aria-label="Copy the {s.name} address">
						{#if copied === s.url}<Check size={16} aria-hidden="true" />Copied{:else}<Copy
								size={16}
								aria-hidden="true"
							/>Copy{/if}
					</button>
				</li>
			{/each}
		</ul>
	</section>
</div>

<style>
	.grid {
		display: grid;
		gap: var(--s5);
	}
	@media (min-width: 60rem) {
		.grid {
			grid-template-columns: 1fr 1.3fr;
		}
	}
	h3 {
		font-size: var(--step-1);
		margin-bottom: var(--s3);
	}
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: var(--s2);
	}
	.files a {
		display: inline-flex;
		align-items: center;
		gap: var(--s2);
		font-weight: 600;
	}
	.note {
		color: var(--ink-2);
		font-size: var(--step--1);
		margin-bottom: var(--s3);
		max-width: 60ch;
	}
	.services li {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: var(--s3);
		padding: var(--s2) var(--s2) var(--s2) var(--s3);
		background: var(--surface);
		border-radius: var(--radius-sm);
		box-shadow: inset 0 0 0 1px var(--line);
	}
	.kind {
		font-weight: 700;
		font-size: var(--step--1);
	}
	code {
		font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace;
		font-size: 0.75rem;
		color: var(--ink-2);
		overflow-wrap: anywhere;
	}
	button {
		display: inline-flex;
		align-items: center;
		gap: var(--s1);
		padding: var(--s1) var(--s3);
		border: 0;
		border-radius: 999px;
		background: var(--accent-wash);
		color: var(--accent);
		font-weight: 650;
		font-size: var(--step--1);
		cursor: pointer;
	}
	button:hover {
		background: #dbe7ff;
	}
</style>
