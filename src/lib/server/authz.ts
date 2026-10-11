import { getRequestEvent } from '$app/server';
import { redirect } from '@sveltejs/kit';

type SessionUser = NonNullable<App.Locals['user']>;

/**
 * Require a signed-in editor inside a remote function. 302, not 307: a form
 * POST must land on the sign-in page as a GET, not be replayed against it.
 */
export function requireEditor(): SessionUser {
	const { locals } = getRequestEvent();
	if (!locals.user) redirect(302, '/login');
	return locals.user;
}
