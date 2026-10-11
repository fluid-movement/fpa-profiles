import type { Handle } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';
import { building } from '$app/env';
import { auth } from '#lib/server/auth.ts';
import { svelteKitHandler } from 'better-auth/svelte-kit';

/**
 * Paths reachable without signing in. `/export` is read by fpa-api and holds
 * only public fields; `/_app/` carries assets and remote function calls, which
 * check the session themselves.
 */
const PUBLIC_PATHS = ['/login', '/export', '/healthz', '/api/auth/', '/_app/'];

function isPublic(pathname: string): boolean {
	return PUBLIC_PATHS.some((path) => pathname === path || (path.endsWith('/') && pathname.startsWith(path)));
}

export const handle: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	if (!building && !event.locals.user && !isPublic(event.url.pathname)) {
		redirect(307, '/login');
	}

	return svelteKitHandler({ event, resolve, auth, building });
};
