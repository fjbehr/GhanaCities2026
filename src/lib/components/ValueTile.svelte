<script lang="ts">
	import type { Component } from 'svelte';
	import type { Reading } from '#lib/levels.ts';
	import LevelBadge from './LevelBadge.svelte';

	let {
		icon: Icon,
		label,
		value,
		detail = '',
		reading = null
	}: {
		icon: Component<{ size?: number; strokeWidth?: number; 'aria-hidden'?: 'true' }>;
		label: string;
		value: string;
		detail?: string;
		reading?: Reading | null;
	} = $props();
</script>

<div class="tile">
	<p class="label">
		<Icon size={18} strokeWidth={2} aria-hidden="true" />
		{label}
	</p>
	<p class="value">{value}</p>
	{#if reading && reading.level !== 'calm'}
		<LevelBadge level={reading.level} label={reading.short ?? reading.label} />
	{:else if detail}
		<p class="detail">{detail}</p>
	{/if}
</div>

<style>
	.tile {
		display: grid;
		align-content: start;
		gap: var(--s2);
		padding: var(--s4);
		background: var(--surface);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		min-width: 0;
	}
	.label {
		display: flex;
		align-items: center;
		gap: var(--s2);
		color: var(--ink-2);
		font-size: var(--step--1);
		font-weight: 600;
	}
	.label :global(svg) {
		color: var(--ink-3);
		flex: none;
	}
	.value {
		font-size: var(--step-3);
		font-weight: 700;
		line-height: 1;
		letter-spacing: -0.02em;
	}
	.detail {
		color: var(--ink-2);
		font-size: var(--step--1);
	}
	@media (max-width: 30rem) {
		.tile {
			padding: var(--s3);
			gap: var(--s1);
		}
		.value {
			font-size: var(--step-2);
		}
	}
</style>
