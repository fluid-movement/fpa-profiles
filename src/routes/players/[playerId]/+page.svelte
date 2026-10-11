<script lang="ts">
	import { page } from '$app/state';
	import { FIELDS, LINK_KINDS, type Link } from '#lib/profile/fields.ts';
	import { getEditor, saveProfile } from './data.remote.ts';

	const editor = $derived(await getEditor(page.params.playerId!));

	// The registry decides the fields, so they are addressed by key at runtime.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const fields = saveProfile.fields as unknown as Record<string, any>;

	const storedLinks = $derived((editor.fields.links as Link[] | undefined) ?? []);
	// One spare row to type into; "Add link" opens more.
	let extraRows = $state(1);
	const linkRows = $derived(storedLinks.length + extraRows);

	const saved = $derived(saveProfile.result?.saved === true);

	const control =
		'mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 shadow-sm focus:border-stone-500 focus:ring-2 focus:ring-stone-300 focus:outline-none aria-invalid:border-red-500';

	function text(key: string): string {
		const value = editor.fields[key];
		return typeof value === 'string' ? value : '';
	}
</script>

<a href="/" class="text-sm text-stone-500 hover:text-stone-900">← All players</a>

<h1 class="mt-2 text-2xl font-semibold">
	{editor.player.fullName}
	{#if editor.player.country}<span class="text-lg font-normal text-stone-500">{editor.player.country}</span>{/if}
</h1>
<p class="mt-1 mb-8 text-sm text-stone-500">
	{#if editor.updatedAt}
		Last saved {new Date(editor.updatedAt).toLocaleString()} by {editor.updatedBy}
	{:else}
		No profile yet.
	{/if}
</p>

<form {...saveProfile} class="space-y-6">
	<input {...fields.playerId.as('hidden', editor.player.id)} />

	{#each FIELDS as field (field.key)}
		{#if field.type === 'links'}
			<fieldset>
				<legend class="text-sm font-medium">{field.label}</legend>
				{#if field.help}<p class="text-sm text-stone-500">{field.help}</p>{/if}

				<div class="mt-2 space-y-2">
					{#each { length: linkRows }, i (i)}
						{@const row = fields.links[i]}
						{@const stored = storedLinks[i]}
						<div class="grid grid-cols-[8rem_1fr_1fr] gap-2">
							<select {...row.kind.as('select', stored?.kind ?? 'website')} aria-label="Link type" class={control}>
								{#each LINK_KINDS as kind (kind)}
									<option value={kind}>{kind}</option>
								{/each}
							</select>
							<input {...row.url.as('url', stored?.url ?? '')} placeholder="https://…" aria-label="URL" class={control} />
							<input {...row.label.as('text', stored?.label ?? '')} placeholder="Label (optional)" aria-label="Label" class={control} />
						</div>
					{/each}
				</div>
				<button
					type="button"
					onclick={() => (extraRows += 1)}
					class="mt-2 text-sm text-stone-600 underline hover:text-stone-900"
				>
					Add link
				</button>
				<p class="mt-1 text-sm text-stone-500">Clear a row's URL and label to remove it.</p>
				{#each fields.links.allIssues() ?? [] as issue (issue.message)}
					<p class="mt-1 text-sm text-red-600">{issue.message}</p>
				{/each}
			</fieldset>
		{:else}
			<label class="block text-sm font-medium">
				{field.label}
				{#if field.help}<span class="block font-normal text-stone-500">{field.help}</span>{/if}
				{#if field.type === 'text'}
					<input {...fields[field.key].as('text', text(field.key))} class={control} />
				{:else}
					{@const { type: _type, ...attributes } = fields[field.key].as('text', text(field.key))}
					<textarea
						{...attributes}
						rows={field.type === 'markdown' ? 12 : 4}
						class="{control} {field.type === 'markdown' ? 'font-mono text-sm' : ''}"
					></textarea>
				{/if}
				{#each fields[field.key].issues() ?? [] as issue (issue.message)}
					<span class="mt-1 block font-normal text-red-600">{issue.message}</span>
				{/each}
			</label>
		{/if}
	{/each}

	{#each saveProfile.fields.allIssues() ?? [] as issue (issue.message)}
		{#if issue.path.length === 0}
			<p class="text-sm text-red-600">{issue.message}</p>
		{/if}
	{/each}

	<div class="flex items-center gap-4 border-t border-stone-200 pt-6">
		<button
			disabled={saveProfile.pending > 0}
			class="rounded-md bg-stone-900 px-4 py-2 font-medium text-white hover:bg-stone-700 disabled:opacity-60"
		>
			{saveProfile.pending > 0 ? 'Saving…' : 'Save profile'}
		</button>
		{#if saved}<span class="text-sm text-emerald-700">Saved.</span>{/if}
	</div>
</form>
