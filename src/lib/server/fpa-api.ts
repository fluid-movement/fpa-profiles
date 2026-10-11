import { FPA_API_URL, FPA_API_REFRESH_TOKEN } from '$app/env/private';

/**
 * fpa-api is the source of every player: this app only attaches profiles to
 * players it finds there, and never creates one.
 */

export interface ApiPlayer {
	id: string;
	fullName: string;
	country: string | null;
	fpaWebsiteIds: string[];
	aliasIds: string[];
}

interface Page<T> {
	items: T[];
	total: number;
}

export class FpaApiError extends Error {}

async function get<T>(path: string): Promise<T | null> {
	let response: Response;
	try {
		response = await fetch(`${FPA_API_URL}${path}`, { signal: AbortSignal.timeout(10_000) });
	} catch (cause) {
		throw new FpaApiError(`fpa-api is unreachable at ${FPA_API_URL}`, { cause });
	}
	if (response.status === 404) return null;
	if (response.status === 503) throw new FpaApiError('fpa-api is still loading its data; try again shortly');
	if (!response.ok) throw new FpaApiError(`fpa-api answered ${response.status} for ${path}`);
	return (await response.json()) as T;
}

export async function searchPlayers(q: string, limit = 50): Promise<Page<ApiPlayer>> {
	const params = new URLSearchParams({ limit: String(limit) });
	if (q) params.set('q', q);
	return (await get<Page<ApiPlayer>>(`/players?${params}`)) ?? { items: [], total: 0 };
}

/** Looks a player up by any of their ids; the result carries the canonical one. */
export async function getPlayer(id: string): Promise<ApiPlayer | null> {
	const profile = await get<{ player: ApiPlayer }>(`/players/${encodeURIComponent(id)}`);
	return profile?.player ?? null;
}

/**
 * Ask fpa-api to pull the export now, so a saved profile is public right away
 * instead of on its next scheduled refresh. Best effort: a failure only delays
 * publication, so it is logged and never fails the save.
 */
export async function requestRefresh(): Promise<void> {
	if (!FPA_API_REFRESH_TOKEN) return;
	try {
		const response = await fetch(`${FPA_API_URL}/refresh`, {
			method: 'POST',
			headers: { authorization: `Bearer ${FPA_API_REFRESH_TOKEN}` },
			signal: AbortSignal.timeout(30_000)
		});
		if (!response.ok) console.warn(`[fpa-api] refresh answered ${response.status}`);
	} catch (error) {
		console.warn('[fpa-api] refresh failed:', (error as Error).message);
	}
}
