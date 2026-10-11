<script lang="ts">
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import OctagonAlert from '@lucide/svelte/icons/octagon-alert';
	import type { Level } from '#lib/levels.ts';

	let { title, current, steps }: { title: string; current: Level; steps: Record<Level, string> } =
		$props();

	const order: Level[] = ['calm', 'watch', 'act', 'severe'];
	const icons = { calm: CircleCheck, watch: CircleAlert, act: TriangleAlert, severe: OctagonAlert };
</script>

<figure class="scale">
	<figcaption>{title} <a href="/data#levels">How we rate</a></figcaption>
	<ol>
		{#each order as level (level)}
			{@const Icon = icons[level]}
			<li class={level} aria-current={level === current ? 'true' : undefined}>
				<span class="bar"></span>
				<span class="word">
					{#if level === current}<Icon size={14} strokeWidth={2.5} aria-hidden="true" />{/if}
					{steps[level]}
				</span>
				{#if level === current}<span class="visually-hidden">(today)</span>{/if}
			</li>
		{/each}
	</ol>
</figure>

<style>
	.scale {
		margin: 0;
		display: grid;
		gap: var(--s2);
		padding: var(--s4);
		background: var(--surface);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
	}
	figcaption {
		display: flex;
		justify-content: space-between;
		gap: var(--s3);
		font-weight: 650;
		font-size: var(--step--1);
	}
	figcaption a {
		font-weight: 600;
	}
	ol {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 2px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		display: grid;
		gap: var(--s2);
		align-content: start;
		color: var(--ink-3);
		font-size: 0.75rem;
		line-height: 1.25;
	}
	.bar {
		height: 6px;
		opacity: 0.35;
	}
	li:first-child .bar {
		border-radius: 3px 0 0 3px;
	}
	li:last-child .bar {
		border-radius: 0 3px 3px 0;
	}
	.calm .bar {
		background: var(--calm);
	}
	.watch .bar {
		background: #ca8a04;
	}
	.act .bar {
		background: #ea580c;
	}
	.severe .bar {
		background: var(--severe);
	}
	li[aria-current] .bar {
		opacity: 1;
		height: 10px;
		margin-top: -2px;
		border-radius: 3px;
	}
	li[aria-current] {
		color: var(--ink);
		font-weight: 700;
	}
	.word {
		display: flex;
		align-items: flex-start;
		gap: 3px;
	}
	.word :global(svg) {
		flex: none;
		margin-top: 1px;
	}
	.calm[aria-current] .word :global(svg) {
		color: var(--calm);
	}
	.watch[aria-current] .word :global(svg) {
		color: var(--watch);
	}
	.act[aria-current] .word :global(svg) {
		color: var(--act);
	}
	.severe[aria-current] .word :global(svg) {
		color: var(--severe);
	}
</style>
