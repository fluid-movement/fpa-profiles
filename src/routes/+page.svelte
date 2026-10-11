<script lang="ts">
	import { page } from '$app/state';
	import { findPlayers } from './data.remote.ts';

	const q = $derived(page.url.searchParams.get('q')?.trim() ?? '');
	const results = $derived(await findPlayers(q));
</script>

<h1 class="mb-2 text-2xl font-semibold">Players</h1>
<p class="mb-6 text-stone-600">
	Players come from the FPA data; find one to add or edit their profile.
</p>

<form method="get" class="mb-6 flex gap-2" data-sveltekit-keepfocus data-sveltekit-replacestate>
	<input
		type="search"
		name="q"
		value={q}
		placeholder="Search by name"
		aria-label="Search players by name"
		class="block w-full rounded-md border border-stone-300 bg-white px-3 py-2 shadow-sm focus:border-stone-500 focus:ring-2 focus:ring-stone-300 focus:outline-none"
	/>
	<button class="rounded-md bg-stone-900 px-4 py-2 font-medium text-white hover:bg-stone-700">Search</button>
</form>

<p class="mb-2 text-sm text-stone-500">
	{results.total} player{results.total === 1 ? '' : 's'}{results.total > results.players.length
		? `, showing the first ${results.players.length}`
		: ''}
</p>

<ul class="divide-y divide-stone-200 rounded-md border border-stone-200 bg-white">
	{#each results.players as player (player.id)}
		<li>
			<a href="/players/{player.id}" class="flex items-center justify-between gap-4 px-4 py-3 hover:bg-stone-50">
				<span>
					{player.fullName}
					{#if player.country}<span class="ml-1 text-sm text-stone-500">{player.country}</span>{/if}
				</span>
				{#if player.hasProfile}
					<span class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Profile</span>
				{/if}
			</a>
		</li>
	{:else}
		<li class="px-4 py-6 text-center text-stone-500">No players match “{q}”.</li>
	{/each}
</ul>
