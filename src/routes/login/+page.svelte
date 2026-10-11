<script lang="ts">
	import { signIn } from '#lib/auth.remote.ts';

	const input =
		'mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 shadow-sm focus:border-stone-500 focus:ring-2 focus:ring-stone-300 focus:outline-none';
</script>

<div class="mx-auto max-w-sm">
	<h1 class="mb-6 text-2xl font-semibold">Sign in</h1>

	<form {...signIn} class="space-y-4">
		<label class="block text-sm font-medium">
			Email
			<input {...signIn.fields.email.as('email')} autocomplete="username" required class={input} />
			{#each signIn.fields.email.issues() ?? [] as issue (issue.message)}
				<span class="mt-1 block text-sm text-red-600">{issue.message}</span>
			{/each}
		</label>

		<label class="block text-sm font-medium">
			Password
			<input {...signIn.fields._password.as('password')} autocomplete="current-password" required class={input} />
		</label>

		{#each signIn.fields.allIssues() ?? [] as issue (issue.message)}
			{#if !issue.path.length}
				<p class="text-sm text-red-600">{issue.message}</p>
			{/if}
		{/each}

		<button
			disabled={signIn.pending > 0}
			class="w-full rounded-md bg-stone-900 px-4 py-2 font-medium text-white hover:bg-stone-700 disabled:opacity-60"
		>
			{signIn.pending > 0 ? 'Signing in…' : 'Sign in'}
		</button>
	</form>

	<p class="mt-6 text-sm text-stone-500">
		Accounts are created by an administrator. There is no sign-up.
	</p>
</div>
