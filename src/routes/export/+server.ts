import { json } from '@sveltejs/kit';
import { buildExport } from '#lib/server/profiles.ts';
import type { RequestHandler } from './$types';

/**
 * The read-only feed fpa-api pulls. Public: it contains only fields the
 * registry marks as exported. The format is the contract with fpa-api.
 */
export const GET: RequestHandler = async () =>
	json(await buildExport(), { headers: { 'cache-control': 'no-store' } });
