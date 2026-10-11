<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import { signOut } from '#lib/auth.remote.ts';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>FPA Profiles</title>
</svelte:head>

<div class="min-h-screen bg-stone-50 text-stone-900">
	<header class="border-b border-stone-200 bg-white">
		<div class="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
			<a href="/" class="font-semibold tracking-tight">FPA Profiles</a>
			{#if data.user}
				<form {...signOut} class="flex items-center gap-3 text-sm text-stone-600">
					<span class="hidden sm:inline">{data.user.name}</span>
					<button class="rounded-md px-2 py-1 hover:bg-stone-100 hover:text-stone-900">Sign out</button>
				</form>
			{/if}
		</div>
	</header>

	<main class="mx-auto max-w-4xl px-4 py-8">
		{@render children()}
	</main>
</div>
