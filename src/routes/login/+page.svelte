<script lang="ts">
	import * as Card from '#lib/components/ui/card/index.ts';
	import * as Field from '#lib/components/ui/field/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { signIn } from '#lib/auth.remote.ts';

	const formIssues = $derived((signIn.fields.allIssues() ?? []).filter((issue) => issue.path.length === 0));
</script>

<Card.Root class="mx-auto max-w-sm">
	<Card.Header>
		<Card.Title>Sign in</Card.Title>
		<Card.Description>Accounts are created by an administrator. There is no sign-up.</Card.Description>
	</Card.Header>
	<Card.Content>
		<form {...signIn}>
			<Field.Group>
				<Field.Field>
					<Field.Label for="email">Email</Field.Label>
					<Input id="email" {...signIn.fields.email.as('email')} autocomplete="username" required />
					<Field.Error errors={signIn.fields.email.issues()} />
				</Field.Field>
				<Field.Field>
					<Field.Label for="password">Password</Field.Label>
					<Input
						id="password"
						{...signIn.fields._password.as('password')}
						autocomplete="current-password"
						required
					/>
				</Field.Field>
				<Field.Error errors={formIssues} />
				<Button type="submit" class="w-full" disabled={signIn.pending > 0}>
					{signIn.pending > 0 ? 'Signing in…' : 'Sign in'}
				</Button>
			</Field.Group>
		</form>
	</Card.Content>
</Card.Root>
