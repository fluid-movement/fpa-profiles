import * as v from 'valibot';
import { form, getRequestEvent } from '$app/server';
import { invalid, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth } from '#lib/server/auth.ts';

export const signIn = form(
	v.object({
		username: v.pipe(v.string(), v.trim(), v.minLength(1, 'Enter your username.')),
		// Leading underscore: Kit never sends a password back to the browser.
		_password: v.pipe(v.string(), v.minLength(1, 'Enter your password.'))
	}),
	async ({ username, _password }) => {
		const { request } = getRequestEvent();
		try {
			// The sveltekitCookies plugin sets the session cookie on this request.
			await auth.api.signInUsername({ body: { username, password: _password }, headers: request.headers });
		} catch (error) {
			if (error instanceof APIError) invalid('Wrong username or password.');
			throw error;
		}
		redirect(303, '/');
	}
);

export const signOut = form(async () => {
	const { request } = getRequestEvent();
	await auth.api.signOut({ headers: request.headers });
	redirect(303, '/login');
});
