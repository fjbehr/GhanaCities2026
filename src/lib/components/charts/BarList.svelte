<script lang="ts">
	import { num } from '#lib/format.ts';

	let {
		title,
		rows,
		unit,
		digits = 0,
		diverging = false,
		positiveLabel = '',
		negativeLabel = '',
		max
	}: {
		title: string;
		rows: { label: string; value: number | null }[];
		unit: string;
		digits?: number;
		/** Bars grow both ways from a centre line (e.g. hotter / cooler than average) */
		diverging?: boolean;
		positiveLabel?: string;
		negativeLabel?: string;
		/** Fixed scale end, e.g. 100 for percentages */
		max?: number;
	} = $props();

	const valid = $derived(
		rows.filter((r) => r.value !== null) as { label: string; value: number }[]
	);
	const end = $derived(max ?? Math.max(1e-9, ...valid.map((r) => Math.abs(r.value))));
	const share = (v: number) => Math.min(1, Math.abs(v) / end) * (diverging ? 50 : 100);
	const fmt = (v: number) =>
		`${diverging && v > 0 ? '+' : diverging && v < 0 ? '−' : ''}${num(Math.abs(v), digits)} ${unit}`;
</script>

<figure class="chart">
	<figcaption>{title}</figcaption>
	{#if diverging}
		<ul class="legend">
			<li><span class="key neg"></span>{negativeLabel}</li>
			<li><span class="key pos"></span>{positiveLabel}</li>
		</ul>
	{/if}
	<ol class="bars" class:diverging>
		{#each valid as r (r.label)}
			<li>
				<span class="name">{r.label}</span>
				<span class="track" aria-hidden="true">
					<span
						class="fill"
						class:neg={r.value < 0}
						style:width="{share(r.value)}%"
						style:left={diverging ? (r.value < 0 ? `${50 - share(r.value)}%` : '50%') : '0'}
					></span>
				</span>
				<span class="val">{fmt(r.value)}</span>
			</li>
		{/each}
	</ol>
</figure>

<style>
	.chart {
		margin: 0;
		display: grid;
		gap: var(--s2);
	}
	figcaption {
		font-weight: 700;
	}
	.legend {
		display: flex;
		gap: var(--s4);
		margin: 0;
		padding: 0;
		list-style: none;
		color: var(--ink-2);
		font-size: var(--step--1);
	}
	.legend li {
		display: inline-flex;
		align-items: center;
		gap: var(--s2);
	}
	.key {
		width: 12px;
		height: 10px;
		border-radius: 3px;
		background: var(--series-1);
	}
	.key.pos {
		background: var(--hotter);
	}
	.key.neg {
		background: var(--cooler);
	}
	.bars {
		display: grid;
		gap: 2px;
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: var(--step--1);
	}
	li {
		display: grid;
		grid-template-columns: minmax(7rem, 11rem) 1fr 4.5rem;
		align-items: center;
		gap: var(--s3);
		min-height: 1.9rem;
	}
	.name {
		color: var(--ink-2);
		overflow-wrap: anywhere;
		line-height: 1.25;
	}
	.track {
		position: relative;
		height: 14px;
	}
	.diverging .track::before {
		content: '';
		position: absolute;
		left: 50%;
		top: -6px;
		bottom: -6px;
		width: 1px;
		background: var(--line-strong);
	}
	.fill {
		position: absolute;
		top: 0;
		bottom: 0;
		background: var(--series-1);
		border-radius: 0 4px 4px 0;
	}
	.diverging .fill {
		background: var(--hotter);
	}
	.diverging .fill.neg {
		background: var(--cooler);
		border-radius: 4px 0 0 4px;
	}
	.val {
		text-align: right;
		font-weight: 650;
		font-variant-numeric: tabular-nums;
	}
</style>
