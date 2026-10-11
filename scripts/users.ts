/**
 * Manage editor accounts from the terminal. The app has no sign-up and sends no
 * email, so this is the only way accounts are created or reset.
 *
 *   pnpm users list
 *   pnpm users create <email> <name>     prints a generated password
 *   pnpm users password <email>          prints a new password, signs the editor out
 *   pnpm users remove <email>
 *
 * Add --password-stdin to `create` or `password` to read the password from
 * stdin instead of generating one. In production, run it inside the container:
 *   node scripts/users.ts create editor@example.com "Editor Name"
 *
 * Rows are written in Better Auth's own shape (a `user` plus a `credential`
 * account holding the hash), using Better Auth's password hashing, so the app
 * signs these editors in like any other.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { account, session, user } from '../src/lib/server/db/auth.schema.ts';

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
			fail('usage: users list | create <email> <name> | password <email> | remove <email> [--password-stdin]');
	}
} finally {
	await client.end();
}

async function list(): Promise<void> {
	const rows = await db.select({ email: user.email, name: user.name, createdAt: user.createdAt }).from(user);
	if (rows.length === 0) console.log('no editors');
	for (const row of rows) console.log(`${row.email}\t${row.name}\tcreated ${row.createdAt.toISOString()}`);
}

async function create(email: string | undefined, name: string): Promise<void> {
	email = normalizeEmail(email);
	if (!name) fail('a name is required');
	if (await findUser(email)) fail(`${email} already exists; use "password" to reset it`);

	const password = await choosePassword();
	const id = randomUUID();
	const now = new Date();

	await db.transaction(async (tx) => {
		await tx.insert(user).values({ id, name, email, emailVerified: true, createdAt: now, updatedAt: now });
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

	console.log(`created ${email}`);
	if (!fromStdin) console.log(`password: ${password}`);
}

async function setPassword(email: string | undefined): Promise<void> {
	email = normalizeEmail(email);
	const existing = await findUser(email);
	if (!existing) fail(`no editor ${email}`);

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

	console.log(`password changed for ${email}; existing sessions signed out`);
	if (!fromStdin) console.log(`password: ${password}`);
}

async function remove(email: string | undefined): Promise<void> {
	email = normalizeEmail(email);
	// Accounts and sessions go with the user (on delete cascade).
	const deleted = await db.delete(user).where(eq(user.email, email)).returning({ id: user.id });
	if (deleted.length === 0) fail(`no editor ${email}`);
	console.log(`removed ${email}`);
}

async function findUser(email: string) {
	const [row] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
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

function normalizeEmail(email: string | undefined): string {
	if (!email || !email.includes('@')) fail('a valid email is required');
	return email.trim().toLowerCase();
}

function fail(message: string): never {
	console.error(`users: ${message}`);
	process.exit(1);
}
