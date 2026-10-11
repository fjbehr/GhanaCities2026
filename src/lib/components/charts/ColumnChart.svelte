<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { num } from '#lib/format.ts';

	export interface Column {
		label: string;
		/** Main series; null leaves a gap */
		value: number | null;
		/** Optional reference value (e.g. the long-term normal), drawn as a line */
		ref?: number | null;
		/** Projection or estimate: drawn lighter, named in the tooltip */
		note?: string;
	}

	let {
		title,
		columns,
		unit,
		digits = 0,
		seriesLabel,
		refLabel
	}: {
		title: string;
		columns: Column[];
		unit: string;
		digits?: number;
		seriesLabel: string;
		refLabel?: string;
	} = $props();

	let width = $state(640);
	const height = 220;
	const pad = { top: 16, right: 8, bottom: 28, left: 40 };
	let active = $state<number | null>(null);

	const max = $derived(Math.max(1, ...columns.flatMap((c) => [c.value ?? 0, c.ref ?? 0])));
	/** Round the axis top to a clean step */
	const top = $derived.by(() => {
		const step = 10 ** Math.floor(Math.log10(max));
		return Math.ceil(max / step) * step;
	});
	const ticks = $derived([0, top / 2, top]);
	const innerW = $derived(Math.max(0, width - pad.left - pad.right));
	const band = $derived(innerW / Math.max(1, columns.length));
	const barW = $derived(Math.min(24, band * 0.6));
	const y = (v: number) => pad.top + (height - pad.top - pad.bottom) * (1 - v / top);
	const cx = (i: number) => pad.left + band * (i + 0.5);
	const hasRef = $derived(columns.some((c) => c.ref !== undefined && c.ref !== null));
	const refPath = $derived(
		columns
			.map((c, i) => (c.ref === null || c.ref === undefined ? null : `${cx(i)},${y(c.ref)}`))
			.filter(Boolean)
			.map((p, i) => `${i ? 'L' : 'M'}${p}`)
			.join(' ')
	);

	/** Column with 4px rounded top, square at the baseline */
	function bar(i: number, v: number) {
		const x = cx(i) - barW / 2;
		const y0 = y(0);
		const y1 = y(v);
		const r = Math.min(4, barW / 2, Math.max(0, y0 - y1));
		return `M${x},${y0} V${y1 + r} Q${x},${y1} ${x + r},${y1} H${x + barW - r} Q${x + barW},${y1} ${x + barW},${y1 + r} V${y0} Z`;
	}

	const fmt = (v: number | null | undefined) =>
		v === null || v === undefined ? '–' : `${num(v, digits)} ${unit}`;
</script>

<figure class="chart">
	<figcaption>{title}</figcaption>
	<ul class="legend">
		<li><span class="key bar"></span>{seriesLabel}</li>
		{#if hasRef && refLabel}<li><span class="key line"></span>{refLabel}</li>{/if}
	</ul>
	<div class="plot" bind:clientWidth={width}>
		<svg viewBox="0 0 {width} {height}" {height} role="group" aria-label={title}>
			{#each ticks as t (t)}
				<line class="grid" x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} />
				<text class="tick" x={pad.left - 6} y={y(t)} dy="0.32em" text-anchor="end">{num(t)}</text>
			{/each}
			{#each columns as c, i (c.label)}
				{#if c.value !== null && c.value > 0}
					<path
						class="col"
						class:note={c.note}
						class:dim={active !== null && active !== i}
						d={bar(i, c.value)}
					/>
				{/if}
				<text class="tick" x={cx(i)} y={height - 8} text-anchor="middle">{c.label}</text>
			{/each}
			{#if hasRef}
				<path class="ref" d={refPath} />
				{#each columns as c, i (c.label)}
					{#if c.ref !== null && c.ref !== undefined}
						<circle class="dot" cx={cx(i)} cy={y(c.ref)} r="4" />
					{/if}
				{/each}
			{/if}
			{#each columns as c, i (c.label)}
				<!-- Each column is a labelled image that keyboard users can step through to see its tooltip -->
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<rect
					class="hit"
					x={cx(i) - band / 2}
					y={pad.top}
					width={band}
					height={height - pad.top - pad.bottom}
					tabindex="0"
					role="img"
					aria-label="{c.label}: {seriesLabel} {fmt(c.value)}{hasRef
						? `, ${refLabel} ${fmt(c.ref)}`
						: ''}"
					onpointerenter={() => (active = i)}
					onpointerleave={() => (active = null)}
					onfocus={() => (active = i)}
					onblur={() => (active = null)}
				/>
			{/each}
		</svg>
		{#if active !== null}
			{@const c = columns[active]}
			<div
				class="tip"
				style:left="{Math.min(Math.max(cx(active), 80), width - 80)}px"
				style:top="{Math.min(y(Math.max(c.value ?? 0, c.ref ?? 0)), height - 90)}px"
				role="status"
			>
				<strong>{c.label}{c.note ? ` · ${c.note}` : ''}</strong>
				<span><i class="key bar"></i><b>{fmt(c.value)}</b> {seriesLabel}</span>
				{#if hasRef}<span><i class="key line"></i><b>{fmt(c.ref)}</b> {refLabel}</span>{/if}
			</div>
		{/if}
	</div>
	<details>
		<summary><ChevronRight size={16} aria-hidden="true" />Show as table</summary>
		<table>
			<thead>
				<tr
					><th scope="col"></th><th scope="col">{seriesLabel}</th>{#if hasRef}<th scope="col"
							>{refLabel}</th
						>{/if}</tr
				>
			</thead>
			<tbody>
				{#each columns as c (c.label)}
					<tr>
						<th scope="row">{c.label}{c.note ? ` (${c.note})` : ''}</th>
						<td>{fmt(c.value)}</td>
						{#if hasRef}<td>{fmt(c.ref)}</td>{/if}
					</tr>
				{/each}
			</tbody>
		</table>
	</details>
</figure>

<style>
	.chart {
		margin: 0;
		display: grid;
		gap: var(--s2);
		min-width: 0;
	}
	figcaption {
		font-weight: 700;
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
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
		display: inline-block;
		flex: none;
	}
	.key.bar {
		width: 10px;
		height: 12px;
		border-radius: 3px 3px 0 0;
		background: var(--series-1);
	}
	.key.line {
		width: 16px;
		height: 2px;
		background: var(--series-2);
		border-radius: 1px;
	}
	.plot {
		position: relative;
		min-width: 0;
	}
	/* Full width of the plot: the viewBox follows the measured width, so the svg never sets it */
	svg {
		display: block;
		width: 100%;
		overflow: visible;
	}
	.grid {
		stroke: var(--line);
		stroke-width: 1;
	}
	.tick {
		fill: var(--ink-3);
		font-size: 11px;
		font-variant-numeric: tabular-nums;
	}
	.col {
		fill: var(--series-1);
		transition: opacity 0.2s var(--ease-out);
	}
	.col.note {
		fill: var(--series-1-soft);
	}
	.col.dim {
		opacity: 0.45;
	}
	.ref {
		fill: none;
		stroke: var(--series-2);
		stroke-width: 2;
		stroke-linejoin: round;
		stroke-linecap: round;
	}
	.dot {
		fill: var(--series-2);
		stroke: var(--surface);
		stroke-width: 2;
	}
	.hit {
		fill: transparent;
		cursor: default;
		outline: none;
	}
	.hit:focus-visible {
		fill: rgb(29 78 216 / 0.06);
	}
	.tip {
		position: absolute;
		transform: translate(-50%, calc(-100% - 10px));
		display: grid;
		gap: 2px;
		padding: var(--s2) var(--s3);
		background: var(--surface);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-raised);
		font-size: var(--step--1);
		white-space: nowrap;
		pointer-events: none;
	}
	.tip span {
		display: flex;
		align-items: center;
		gap: var(--s2);
		color: var(--ink-2);
	}
	.tip b {
		color: var(--ink);
	}
	.tip .key.bar {
		width: 12px;
		height: 2px;
		border-radius: 1px;
	}
	details {
		font-size: var(--step--1);
	}
	summary {
		display: inline-flex;
		align-items: center;
		gap: var(--s1);
		cursor: pointer;
		color: var(--accent);
		font-weight: 600;
		list-style: none;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	summary :global(svg) {
		transition: transform 0.2s var(--ease-out);
	}
	details[open] summary :global(svg) {
		transform: rotate(90deg);
	}
	table {
		margin-top: var(--s2);
		width: 100%;
	}
	th,
	td {
		text-align: right;
		padding: var(--s1) var(--s2);
		border-bottom: 1px solid var(--line);
	}
	th[scope='row'],
	thead th:first-child {
		text-align: left;
		font-weight: 600;
	}
</style>
