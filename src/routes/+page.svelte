<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import * as Card from '#lib/components/ui/card/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import { Switch } from '#lib/components/ui/switch/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Separator } from '#lib/components/ui/separator/index.ts';
	import { findPlayers } from './data.remote.ts';

	// The URL is the filter state, so going back from a profile restores the list.
	const q = $derived(page.url.searchParams.get('q')?.trim() ?? '');
	const withProfile = $derived(page.url.searchParams.get('profiles') === '1');
	const results = $derived(await findPlayers({ q, withProfile }));

	// Writable derived: the switch flips the moment it is clicked, and the URL
	// takes back over once the navigation lands (and on history back).
	let profilesOnly = $derived(withProfile);

	// The input's own text, so typing is never interrupted by a URL round trip.
	// Seeded from the URL, which is what history navigation restores.
	let typed = $state(page.url.searchParams.get('q') ?? '');
	let timer: ReturnType<typeof setTimeout> | undefined;

	function applyFilters(next: { q?: string; withProfile?: boolean }) {
		const params = new URLSearchParams(page.url.search);
		const nextQ = (next.q ?? q).trim();
		const nextWithProfile = next.withProfile ?? withProfile;
		if (nextQ) params.set('q', nextQ);
		else params.delete('q');
		if (nextWithProfile) params.set('profiles', '1');
		else params.delete('profiles');

		const search = params.toString();
		// replace: one history entry per visit to the list, not per keystroke.
		// reset: false keeps focus in the input and the scroll position.
		goto(search ? `?${search}` : page.url.pathname, { replace: true, reset: false });
	}

	function onInput(value: string) {
		typed = value;
		clearTimeout(timer);
		timer = setTimeout(() => applyFilters({ q: value }), 200);
	}
</script>

<div class="mb-6 space-y-1">
	<h1 class="text-2xl font-semibold tracking-tight">Players</h1>
	<p class="text-muted-foreground">Players come from the FPA data; find one to add or edit their profile.</p>
</div>

<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
	<Input
		type="search"
		value={typed}
		oninput={(event) => onInput(event.currentTarget.value)}
		placeholder="Filter by name"
		aria-label="Filter players by name"
		autocomplete="off"
	/>
	<div class="flex shrink-0 items-center gap-2">
		<Switch
			id="with-profile"
			bind:checked={profilesOnly}
			onCheckedChange={(checked) => applyFilters({ q: typed, withProfile: checked })}
		/>
		<Label for="with-profile">Only with profile</Label>
	</div>
</div>

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
		<p class="px-4 py-6 text-center text-muted-foreground">
			{#if q}No players match “{q}”{withProfile ? ' with a profile' : ''}.{:else}No players with a profile yet.{/if}
		</p>
	{/each}
</Card.Root>
