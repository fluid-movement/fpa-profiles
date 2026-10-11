<script lang="ts">
	import { page } from '$app/state';
	import * as Card from '#lib/components/ui/card/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Separator } from '#lib/components/ui/separator/index.ts';
	import { findPlayers } from './data.remote.ts';

	const q = $derived(page.url.searchParams.get('q')?.trim() ?? '');
	const results = $derived(await findPlayers(q));
</script>

<div class="mb-6 space-y-1">
	<h1 class="text-2xl font-semibold tracking-tight">Players</h1>
	<p class="text-muted-foreground">Players come from the FPA data; find one to add or edit their profile.</p>
</div>

<form method="get" class="mb-6 flex gap-2" data-sveltekit-keepfocus data-sveltekit-replacestate>
	<Input type="search" name="q" value={q} placeholder="Search by name" aria-label="Search players by name" />
	<Button type="submit">Search</Button>
</form>

<p class="mb-2 text-sm text-muted-foreground">
	{results.total} player{results.total === 1 ? '' : 's'}{results.total > results.players.length
		? `, showing the first ${results.players.length}`
		: ''}
</p>

<Card.Root class="gap-0 py-0">
	{#each results.players as player, i (player.id)}
		{#if i > 0}<Separator />{/if}
		<a href="/players/{player.id}" class="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/50">
			<span>
				{player.fullName}
				{#if player.country}<span class="ml-1 text-sm text-muted-foreground">{player.country}</span>{/if}
			</span>
			{#if player.hasProfile}<Badge variant="secondary">Profile</Badge>{/if}
		</a>
	{:else}
		<p class="px-4 py-6 text-center text-muted-foreground">No players match “{q}”.</p>
	{/each}
</Card.Root>
