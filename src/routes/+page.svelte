<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import * as Card from '#lib/components/ui/card/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import { Switch } from '#lib/components/ui/switch/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Separator } from '#lib/components/ui/separator/index.ts';
	import * as Pagination from '#lib/components/ui/pagination/index.ts';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.ts';
	import { DEFAULT_PAGE_SIZE, PAGE_SIZES, type PageSize } from '#lib/page-sizes.ts';
	import { findPlayers } from './data.remote.ts';

	// The URL is the filter state, so going back from a profile restores the list.
	const q = $derived(page.url.searchParams.get('q')?.trim() ?? '');
	const withProfile = $derived(page.url.searchParams.get('profiles') === '1');
	const pageNumber = $derived.by(() => {
		const value = Number(page.url.searchParams.get('page'));
		return Number.isInteger(value) && value >= 1 ? value : 1;
	});
	const sizeParam = $derived(Number(page.url.searchParams.get('size')));
	const size = $derived(
		(PAGE_SIZES as readonly number[]).includes(sizeParam) ? (sizeParam as PageSize) : DEFAULT_PAGE_SIZE
	);
	const results = $derived(await findPlayers({ q, withProfile, page: pageNumber, size }));

	// Writable derived: the switch flips the moment it is clicked, and the URL
	// takes back over once the navigation lands (and on history back).
	let profilesOnly = $derived(withProfile);

	// The input's own text, so typing is never interrupted by a URL round trip.
	// Seeded from the URL, which is what history navigation restores.
	let typed = $state(page.url.searchParams.get('q') ?? '');
	let timer: ReturnType<typeof setTimeout> | undefined;

	// Writable derived like profilesOnly: the radio moves at once, the URL follows.
	let sizeChoice = $derived(String(size));

	function applyFilters(next: { q?: string; withProfile?: boolean; page?: number; size?: number }) {
		const params = new URLSearchParams(page.url.search);
		const nextQ = (next.q ?? q).trim();
		const nextWithProfile = next.withProfile ?? withProfile;
		if (nextQ) params.set('q', nextQ);
		else params.delete('q');
		if (nextWithProfile) params.set('profiles', '1');
		else params.delete('profiles');
		// Any change to the filters or the size starts again from the first page.
		if (next.page && next.page > 1) params.set('page', String(next.page));
		else params.delete('page');
		const nextSize = next.size ?? size;
		if (nextSize !== DEFAULT_PAGE_SIZE) params.set('size', String(nextSize));
		else params.delete('size');

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
	<p class="text-muted-foreground">Players come from the FPA data. Find one to add or edit their profile.</p>
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

<div class="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
	{#if results.pageCount > 1}
		<Pagination.Root
			count={results.total}
			perPage={size}
			page={results.page}
			onPageChange={(next) => applyFilters({ q: typed, page: next })}
			class="mx-0 w-auto justify-start"
		>
			{#snippet children({ pages, currentPage })}
				<Pagination.Content>
					<Pagination.Item><Pagination.PrevButton /></Pagination.Item>
					{#each pages as item (item.key)}
						{#if item.type === 'ellipsis'}
							<Pagination.Item><Pagination.Ellipsis /></Pagination.Item>
						{:else}
							<Pagination.Item>
								<Pagination.Link page={item} isActive={currentPage === item.value}>{item.value}</Pagination.Link>
							</Pagination.Item>
						{/if}
					{/each}
					<Pagination.Item><Pagination.NextButton /></Pagination.Item>
				</Pagination.Content>
			{/snippet}
		</Pagination.Root>
	{:else}
		<span></span>
	{/if}
	<div class="flex items-center gap-3">
		<span class="text-sm text-muted-foreground" id="page-size-label">Per page</span>
		<ToggleGroup.Root
			type="single"
			variant="outline"
			bind:value={sizeChoice}
			onValueChange={(value) => {
				// A single toggle group lets the active item be switched off; keep one selected.
				if (value) applyFilters({ q: typed, size: Number(value) });
				else sizeChoice = String(size);
			}}
			aria-labelledby="page-size-label"
		>
			{#each PAGE_SIZES as option (option)}
				<ToggleGroup.Item value={String(option)} aria-label="{option} per page">{option}</ToggleGroup.Item>
			{/each}
		</ToggleGroup.Root>
	</div>
</div>

<p class="mb-2 text-sm text-muted-foreground">
	{results.total} player{results.total === 1 ? '' : 's'}{results.pageCount > 1
		? `, page ${results.page} of ${results.pageCount}`
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
