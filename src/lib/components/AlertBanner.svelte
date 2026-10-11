<script lang="ts">
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import OctagonAlert from '@lucide/svelte/icons/octagon-alert';
	import { site } from '#lib/copy.ts';
	import type { Live } from '#lib/server/live.ts';
	import LevelBadge from './LevelBadge.svelte';

	let { headline }: { headline: Live['headline'] } = $props();

	const icons = { watch: CircleAlert, act: TriangleAlert, severe: OctagonAlert };
	const Icon = $derived(headline.level === 'calm' ? null : icons[headline.level]);
</script>

{#if headline.level === 'calm' || !Icon}
	<div class="calm" role="status">
		<LevelBadge level="calm" label={headline.label} />
		<p class="fine">{site.notOfficial}</p>
	</div>
{:else}
	<section class="alert {headline.level}" aria-labelledby="alert-title">
		<h2 id="alert-title">
			<Icon size={26} strokeWidth={2.25} aria-hidden="true" />
			{headline.label}
		</h2>
		{#if headline.advice}<p class="advice">{headline.advice}</p>{/if}
		<p class="fine">
			Not an official warning. Follow the
			<a href={site.gmet} rel="external">Ghana Meteorological Agency</a> and
			<a href={site.nadmo} rel="external">NADMO</a>.
		</p>
	</section>
{/if}

<style>
	.calm {
		display: grid;
		gap: var(--s2);
		justify-items: start;
	}
	.alert {
		display: grid;
		gap: var(--s2);
		padding: var(--s4) var(--s5);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
	}
	.alert.watch {
		background: var(--watch-wash);
		--level: var(--watch);
	}
	.alert.act {
		background: var(--act-wash);
		--level: var(--act);
	}
	.alert.severe {
		background: var(--severe-wash);
		--level: var(--severe);
	}
	h2 {
		display: flex;
		align-items: center;
		gap: var(--s2);
		font-size: var(--step-2);
	}
	h2 :global(svg) {
		flex: none;
		color: var(--level);
	}
	.advice {
		font-size: var(--step-1);
		max-width: 52ch;
	}
	.fine {
		color: var(--ink-2);
		font-size: var(--step--1);
		max-width: 62ch;
	}
</style>
