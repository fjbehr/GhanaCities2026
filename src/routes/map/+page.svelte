<script lang="ts">
	import { page } from '$app/state';
	import { getCity } from '#lib/config/cities.ts';
	import { portalUrl } from '#lib/config/map.ts';
	import { topics, type TopicSlug } from '#lib/config/topics.ts';
	import { site } from '#lib/copy.ts';

	const city = $derived(getCity(page.url.searchParams.get('city') ?? ''));
	const topicParam = $derived(page.url.searchParams.get('topic'));
	const topic = $derived(
		topics.some((t) => t.slug === topicParam) ? (topicParam as TopicSlug) : undefined
	);
	const src = $derived(portalUrl(city, topic));
</script>

<svelte:head>
	<title>Map{city ? ` of ${city.name}` : ''} — {site.name}</title>
</svelte:head>

<h1 class="visually-hidden">Map{city ? ` of ${city.name}` : ' of Ghana'}</h1>
<iframe {src} title="Interactive map" allow="geolocation; fullscreen"></iframe>

<style>
	iframe {
		display: block;
		width: 100%;
		height: calc(100dvh - 7rem);
		min-height: 28rem;
		border: 0;
		background: var(--surface-sunk);
	}
	@media (min-width: 60rem) {
		iframe {
			height: calc(100dvh - 4.5rem);
		}
	}
</style>
