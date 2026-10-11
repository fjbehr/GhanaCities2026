<script lang="ts">
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import OctagonAlert from '@lucide/svelte/icons/octagon-alert';
	import type { Level } from '#lib/levels.ts';

	let { level, label }: { level: Level; label: string } = $props();

	// Shape differs by level as well as colour, so the level never depends on colour alone
	const icons = { calm: CircleCheck, watch: CircleAlert, act: TriangleAlert, severe: OctagonAlert };
	const Icon = $derived(icons[level]);
</script>

<span class="badge {level}">
	<Icon size={16} strokeWidth={2.25} aria-hidden="true" />
	{label}
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
		padding: 0.2em 0.6em 0.2em 0.45em;
		border-radius: 999px;
		font-size: var(--step--1);
		font-weight: 650;
		line-height: 1.3;
	}
	.calm {
		color: var(--calm);
		background: var(--calm-wash);
	}
	.watch {
		color: var(--watch);
		background: var(--watch-wash);
	}
	.act {
		color: var(--act);
		background: var(--act-wash);
	}
	.severe {
		color: var(--severe);
		background: var(--severe-wash);
	}
	.badge :global(svg) {
		flex: none;
	}
</style>
