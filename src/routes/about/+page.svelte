<script lang="ts">
	import { site } from '#lib/copy.ts';
</script>

<svelte:head>
	<title>About — {site.name}</title>
	<meta name="description" content="Why Ghana Cities exists, who it is for and how it is made." />
</svelte:head>

<article class="wrap doc">
	<h1>About {site.name}</h1>

	<section>
		<h2>Why this site exists</h2>
		<p>
			A great deal of free information about Ghana’s cities exists — satellite images, weather
			models, population estimates, maps drawn by volunteers — but it is scattered across portals
			that expect a specialist. {site.name} brings it together for Accra, Kumasi, Tamale, Sekondi-Takoradi
			and Cape Coast and says in plain words what it means.
		</p>
	</section>

	<section>
		<h2>Who it is for</h2>
		<p>
			First for residents: is heavy rain coming, how hot and dusty will it be, how far is the
			nearest clinic? Then for district assemblies, planners, NGOs, journalists and researchers, who
			can compare districts, read the methods and download the data for their own work.
		</p>
	</section>

	<section>
		<h2>What it is not</h2>
		<p>
			It is not a warning service. Ratings on this site are our reading of open forecast data. For
			official warnings, follow the
			<a href={site.gmet} rel="external">Ghana Meteorological Agency</a> and
			<a href={site.nadmo} rel="external">NADMO</a>.
		</p>
	</section>

	<section>
		<h2>How it is made</h2>
		<p>
			The site is non-commercial and built only with open-source software — SvelteKit, PostgreSQL
			with PostGIS, GeoServer and the Masterportal — and with openly licensed data. Every source,
			licence and method is listed on the <a href="/data">data page</a>.
		</p>
		<p>
			{site.name} is developed together with partners in Ghana. Their names will appear here once the
			partnerships are confirmed.
		</p>
	</section>

	<section>
		<h2>Languages</h2>
		<p>
			The site is in English for now. All texts are kept in one place so that Twi, Ga and Dagbani
			can follow.
		</p>
	</section>

	<section>
		<h2>Help improve the map</h2>
		<p>
			Clinics, schools, markets and water points come from OpenStreetMap. If something near you is
			missing, you can add it at
			<a href="https://www.openstreetmap.org" rel="external">openstreetmap.org</a> — it will appear here
			the next time the data is rebuilt.
		</p>
	</section>
</article>

<style>
	.doc {
		padding-top: var(--s7);
		display: grid;
		gap: var(--s6);
		max-width: min(100% - 2 * var(--gutter), 46rem);
	}
	h1 {
		font-size: var(--step-4);
		letter-spacing: -0.025em;
	}
	section {
		display: grid;
		gap: var(--s3);
	}
	h2 {
		font-size: var(--step-2);
	}
	p {
		font-size: var(--step-1);
		color: var(--ink-2);
		line-height: 1.6;
	}
</style>
