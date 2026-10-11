import { ORIGIN, BETTER_AUTH_SECRET } from '$app/env/private';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { username } from 'better-auth/plugins';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { db } from '#lib/server/db/index.ts';
import { USERNAME_PATTERN } from '#lib/usernames.ts';

/**
 * Editors sign in with a username and password. The app has no email: no
 * sign-up, no verification, no reset links. Accounts are created from the
 * terminal (scripts/users.ts).
 *
 * Better Auth's core user table still requires a unique `email`; the users
 * script fills it with an internal placeholder (see `#lib/usernames.ts`) that
 * is never shown or asked for.
 */
export const auth = betterAuth({
	baseURL: ORIGIN,
	secret: BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	// Holds the password credential that username sign-in checks.
	emailAndPassword: { enabled: true, disableSignUp: true },
	plugins: [
		username({ usernameValidator: (name) => USERNAME_PATTERN.test(name) }),
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});

export type SessionUser = typeof auth.$Infer.Session.user;
