/**
 * Manage editor accounts from the terminal. Editors sign in with a username
 * and password; the app has no sign-up and no email, so this is the only way
 * accounts are created or reset.
 *
 *   pnpm users list
 *   pnpm users create <username> [display name]   prints a generated password
 *   pnpm users password <username>                prints a new password, signs the editor out
 *   pnpm users remove <username>
 *
 * Add --password-stdin to `create` or `password` to read the password from
 * stdin instead of generating one. In production, run it inside the container:
 *   node scripts/users.ts create andre "André"
 *
 * Rows are written in Better Auth's own shape (a `user` with the username
 * plugin's columns plus a `credential` account holding the hash), using Better
 * Auth's password hashing, so the app signs these editors in like any other.
 * Better Auth requires a unique email on every user; it gets an internal
 * placeholder that is never shown.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { account, session, user } from '../src/lib/server/db/auth.schema.ts';
import { placeholderEmail, USERNAME_PATTERN } from '../src/lib/usernames.ts';

const MIN_PASSWORD_LENGTH = 12;

const url = process.env.DATABASE_URL;
if (!url) fail('DATABASE_URL is not set');

const args = process.argv.slice(2);
const fromStdin = args.includes('--password-stdin');
const [command, ...rest] = args.filter((arg) => arg !== '--password-stdin');

const client = postgres(url, { max: 1, onnotice: () => {} });
const db = drizzle(client);

try {
	switch (command) {
		case 'list':
			await list();
			break;
		case 'create':
			await create(rest[0], rest.slice(1).join(' '));
			break;
		case 'password':
			await setPassword(rest[0]);
			break;
		case 'remove':
			await remove(rest[0]);
			break;
		default:
			fail('usage: users list | create <username> [display name] | password <username> | remove <username> [--password-stdin]');
	}
} finally {
	await client.end();
}

async function list(): Promise<void> {
	const rows = await db
		.select({ username: user.username, name: user.name, createdAt: user.createdAt })
		.from(user)
		.orderBy(user.username);
	if (rows.length === 0) console.log('no editors');
	for (const row of rows) console.log(`${row.username}\t${row.name}\tcreated ${row.createdAt.toISOString()}`);
}

async function create(rawUsername: string | undefined, displayName: string): Promise<void> {
	const username = normalizeUsername(rawUsername);
	if (await findUser(username)) fail(`${username} already exists; use "password" to reset it`);
	const name = displayName || username;

	const password = await choosePassword();
	const id = randomUUID();
	const now = new Date();

	await db.transaction(async (tx) => {
		await tx.insert(user).values({
			id,
			name,
			username,
			displayUsername: rawUsername!.trim(),
			email: placeholderEmail(username),
			emailVerified: false,
			createdAt: now,
			updatedAt: now
		});
		await tx.insert(account).values({
			id: randomUUID(),
			accountId: id,
			providerId: 'credential',
			userId: id,
			password: await hashPassword(password),
			createdAt: now,
			updatedAt: now
		});
	});

	console.log(`created ${username}`);
	if (!fromStdin) console.log(`password: ${password}`);
}

async function setPassword(rawUsername: string | undefined): Promise<void> {
	const username = normalizeUsername(rawUsername);
	const existing = await findUser(username);
	if (!existing) fail(`no editor ${username}`);

	const password = await choosePassword();
	const hash = await hashPassword(password);

	await db.transaction(async (tx) => {
		const updated = await tx
			.update(account)
			.set({ password: hash, updatedAt: new Date() })
			.where(eq(account.userId, existing.id))
			.returning({ id: account.id });
		if (updated.length === 0) {
			await tx.insert(account).values({
				id: randomUUID(),
				accountId: existing.id,
				providerId: 'credential',
				userId: existing.id,
				password: hash,
				createdAt: new Date(),
				updatedAt: new Date()
			});
		}
		// A reset password should end every existing session.
		await tx.delete(session).where(eq(session.userId, existing.id));
	});

	console.log(`password changed for ${username}; existing sessions signed out`);
	if (!fromStdin) console.log(`password: ${password}`);
}

async function remove(rawUsername: string | undefined): Promise<void> {
	const username = normalizeUsername(rawUsername);
	// Accounts and sessions go with the user (on delete cascade).
	const deleted = await db.delete(user).where(eq(user.username, username)).returning({ id: user.id });
	if (deleted.length === 0) fail(`no editor ${username}`);
	console.log(`removed ${username}`);
}

async function findUser(username: string) {
	const [row] = await db.select({ id: user.id }).from(user).where(eq(user.username, username)).limit(1);
	return row;
}

async function choosePassword(): Promise<string> {
	if (!fromStdin) return randomBytes(18).toString('base64url');

	const chunks: Buffer[] = [];
	for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
	const password = Buffer.concat(chunks).toString('utf8').replace(/\r?\n$/, '');
	if (password.length < MIN_PASSWORD_LENGTH) fail(`the password must be at least ${MIN_PASSWORD_LENGTH} characters`);
	return password;
}

/** Lowercased, as Better Auth's username plugin stores and compares them. */
function normalizeUsername(raw: string | undefined): string {
	const username = raw?.trim().toLowerCase() ?? '';
	if (!USERNAME_PATTERN.test(username)) {
		fail('a username is required: 3-30 characters, letters, digits, dots, underscores or hyphens');
	}
	return username;
}

function fail(message: string): never {
	console.error(`users: ${message}`);
	process.exit(1);
}
