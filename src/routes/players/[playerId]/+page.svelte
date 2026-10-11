<script lang="ts">
	import { page } from '$app/state';
	import * as Card from '#lib/components/ui/card/index.ts';
	import * as Field from '#lib/components/ui/field/index.ts';
	import * as NativeSelect from '#lib/components/ui/native-select/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Textarea } from '#lib/components/ui/textarea/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
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
	const formIssues = $derived((saveProfile.fields.allIssues() ?? []).filter((issue) => issue.path.length === 0));

	function text(key: string): string {
		const value = editor.fields[key];
		return typeof value === 'string' ? value : '';
	}

	/** Kit's field attributes without `type`, for elements that have none. */
	function untyped(key: string) {
		const { type: _type, ...attributes } = fields[key].as('text', text(key));
		return attributes;
	}
</script>

<Button href="/" variant="link" class="mb-2 h-auto px-0 text-muted-foreground">← All players</Button>

<div class="mb-6 space-y-1">
	<h1 class="text-2xl font-semibold tracking-tight">
		{editor.player.fullName}
		{#if editor.player.country}<span class="text-lg font-normal text-muted-foreground">{editor.player.country}</span>{/if}
	</h1>
	<p class="text-sm text-muted-foreground">
		{#if editor.updatedAt}
			Last saved {new Date(editor.updatedAt).toLocaleString()} by {editor.updatedBy}
		{:else}
			No profile yet.
		{/if}
	</p>
</div>

<Card.Root>
	<Card.Content>
		<form {...saveProfile}>
			<input {...fields.playerId.as('hidden', editor.player.id)} />

			<Field.Group>
				{#each FIELDS as field (field.key)}
					{#if field.type === 'links'}
						<Field.Set>
							<Field.Legend>{field.label}</Field.Legend>
							{#if field.help}<Field.Description>{field.help}</Field.Description>{/if}

							{#each { length: linkRows }, i (i)}
								{@const row = fields.links[i]}
								{@const stored = storedLinks[i]}
								<div class="grid grid-cols-[8rem_1fr_1fr] gap-2">
									<NativeSelect.Root {...row.kind.as('select', stored?.kind ?? 'website')} aria-label="Link type">
										{#each LINK_KINDS as kind (kind)}
											<NativeSelect.Option value={kind}>{kind}</NativeSelect.Option>
										{/each}
									</NativeSelect.Root>
									<Input {...row.url.as('url', stored?.url ?? '')} placeholder="https://…" aria-label="URL" />
									<Input {...row.label.as('text', stored?.label ?? '')} placeholder="Label (optional)" aria-label="Label" />
								</div>
							{/each}

							<div>
								<Button type="button" variant="outline" size="sm" onclick={() => (extraRows += 1)}>Add link</Button>
							</div>
							<Field.Description>Clear a row's URL and label to remove it.</Field.Description>
							<Field.Error errors={fields.links.allIssues()} />
						</Field.Set>
					{:else}
						<Field.Field>
							<Field.Label for={field.key}>{field.label}</Field.Label>
							{#if field.type === 'text'}
								<Input id={field.key} {...fields[field.key].as('text', text(field.key))} />
							{:else}
								<Textarea
									id={field.key}
									{...untyped(field.key)}
									rows={field.type === 'markdown' ? 12 : 4}
									class={field.type === 'markdown' ? 'font-mono' : ''}
								/>
							{/if}
							{#if field.help}<Field.Description>{field.help}</Field.Description>{/if}
							<Field.Error errors={fields[field.key].issues()} />
						</Field.Field>
					{/if}
				{/each}

				<Field.Error errors={formIssues} />

				<Field.Field orientation="horizontal">
					<Button type="submit" disabled={saveProfile.pending > 0}>
						{saveProfile.pending > 0 ? 'Saving…' : 'Save profile'}
					</Button>
					{#if saved}<span class="text-sm text-muted-foreground">Saved.</span>{/if}
				</Field.Field>
			</Field.Group>
		</form>
	</Card.Content>
</Card.Root>
