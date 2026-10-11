<script lang="ts">
	import { dayName, num } from '#lib/format.ts';
	import type { Weather } from '#lib/server/sources/open-meteo.ts';

	let { days }: { days: Weather['days'] } = $props();
</script>

<table>
	<caption class="visually-hidden">Three-day outlook</caption>
	<thead>
		<tr>
			<th scope="col">Day</th>
			<th scope="col" class="num">High / low</th>
			<th scope="col" class="num">Feels like</th>
			<th scope="col" class="num">Rain</th>
		</tr>
	</thead>
	<tbody>
		{#each days as d (d.date)}
			<tr>
				<th scope="row">{dayName(d.date)}</th>
				<td class="num">{num(d.tempMax)}° / {num(d.tempMin)}°</td>
				<td class="num">{num(d.feelsLikeMax)}°</td>
				<td class="num"
					>{num(d.rain, 1)} mm <span class="chance">{num(d.rainProbability)} %</span></td
				>
			</tr>
		{/each}
	</tbody>
</table>

<style>
	table {
		width: 100%;
		font-size: var(--step--1);
	}
	th,
	td {
		padding: var(--s2) var(--s1);
		border-bottom: 1px solid var(--line);
		text-align: left;
	}
	thead th {
		color: var(--ink-3);
		font-weight: 600;
	}
	tbody th {
		font-weight: 650;
	}
	tbody tr:last-child > * {
		border-bottom: 0;
	}
	.num {
		text-align: right;
	}
	.chance {
		color: var(--ink-3);
		margin-left: var(--s1);
	}
</style>
