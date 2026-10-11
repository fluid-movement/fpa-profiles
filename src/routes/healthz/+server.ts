import { text } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** Liveness only, for the container health check. */
export const GET: RequestHandler = () => text('ok');
