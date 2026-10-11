<script lang="ts">
	import { page } from '$app/state';
	import { cities } from '#lib/config/cities.ts';
	import { site } from '#lib/copy.ts';
</script>

<svelte:head>
	<title>{page.status === 404 ? 'Page not found' : 'Something went wrong'} — {site.name}</title>
</svelte:head>

<section class="wrap err">
	<h1>
		{page.status === 404 ? 'We could not find this page' : 'Something went wrong on our side'}
	</h1>
	<p>
		{page.status === 404
			? (page.error?.message ?? 'The address may be mistyped, or the page has moved.')
			: 'Please try again in a minute. If it keeps happening, the data sources may be down.'}
	</p>
	<p>Go to a city:</p>
	<ul>
		{#each cities as c (c.slug)}
			<li><a href="/city/{c.slug}">{c.name}</a></li>
		{/each}
	</ul>
</section>

<style>
	.err {
		padding-block: var(--s8);
		display: grid;
		gap: var(--s4);
		max-width: min(100% - 2 * var(--gutter), 46rem);
	}
	h1 {
		font-size: var(--step-3);
	}
	p {
		color: var(--ink-2);
		font-size: var(--step-1);
	}
	ul {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s2) var(--s4);
		margin: 0;
		padding: 0;
		list-style: none;
		font-weight: 650;
	}
</style>
