<script lang="ts">
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import { num } from '#lib/format.ts';
	import type { Column, DistrictRow } from '#lib/indicators.ts';

	let { rows, columns, caption }: { rows: DistrictRow[]; columns: Column[]; caption: string } =
		$props();

	let sortKey = $state('name');
	let ascending = $state(true);

	const sorted = $derived(
		[...rows].sort((a, b) => {
			const x = a[sortKey];
			const y = b[sortKey];
			const order =
				typeof x === 'number' && typeof y === 'number'
					? x - y
					: String(x ?? '').localeCompare(String(y ?? ''));
			return ascending ? order : -order;
		})
	);

	function sortBy(key: string) {
		if (sortKey === key) ascending = !ascending;
		else {
			sortKey = key;
			ascending = key === 'name';
		}
	}
	const aria = (key: string) =>
		sortKey === key ? (ascending ? 'ascending' : 'descending') : 'none';
	const cell = (v: unknown, digits = 0) => (typeof v === 'number' ? num(v, digits) : '–');
</script>

{#snippet arrow(key: string)}
	{#if sortKey === key}
		{#if ascending}<ArrowUp size={14} strokeWidth={2.25} aria-hidden="true" />{:else}<ArrowDown
				size={14}
				strokeWidth={2.25}
				aria-hidden="true"
			/>{/if}
	{/if}
{/snippet}

<div class="scroll" role="region" aria-label={caption} tabindex="-1">
	<table>
		<caption class="visually-hidden">{caption}</caption>
		<thead>
			<tr>
				<th scope="col" aria-sort={aria('name')}>
					<button type="button" onclick={() => sortBy('name')}
						>District{@render arrow('name')}</button
					>
				</th>
				{#each columns as c (c.key)}
					<th scope="col" aria-sort={aria(c.key)} class="num">
						<button type="button" onclick={() => sortBy(c.key)}>
							{c.label}{c.unit ? ` (${c.unit})` : ''}{@render arrow(c.key)}
						</button>
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each sorted as r (r.shape_id)}
				<tr>
					<th scope="row">{r.name}</th>
					{#each columns as c (c.key)}
						<td class="num">{cell(r[c.key], c.digits)}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.scroll {
		overflow-x: auto;
		border-radius: var(--radius);
		background: var(--surface);
		box-shadow: var(--shadow);
	}
	table {
		width: 100%;
		font-size: var(--step--1);
	}
	th,
	td {
		padding: var(--s2) var(--s3);
		border-bottom: 1px solid var(--line);
		text-align: left;
		vertical-align: top;
	}
	tbody tr:last-child > * {
		border-bottom: 0;
	}
	tbody tr:hover {
		background: var(--accent-wash);
	}
	thead th {
		padding: 0;
		vertical-align: bottom;
		position: sticky;
		top: 0;
		background: var(--surface);
		border-bottom: 1px solid var(--line-strong);
	}
	th[scope='row'] {
		font-weight: 600;
		min-width: 10rem;
	}
	.num {
		text-align: right;
	}
	thead button {
		all: unset;
		cursor: pointer;
		font-weight: 650;
		color: var(--ink-2);
		line-height: 1.3;
		/* The whole header cell is the sort control (44 px touch target) */
		display: block;
		box-sizing: border-box;
		width: 100%;
		min-height: 2.75rem;
		padding: var(--s3);
	}
	thead button:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: -3px;
		border-radius: 4px;
	}
	thead button :global(svg) {
		vertical-align: -2px;
		margin-left: 2px;
	}
	th[aria-sort='ascending'] button,
	th[aria-sort='descending'] button {
		color: var(--ink);
	}
</style>
