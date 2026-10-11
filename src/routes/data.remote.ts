import * as v from 'valibot';
import { query } from '$app/server';
import { requireEditor } from '#lib/server/authz.ts';
import { allPlayers } from '#lib/server/fpa-api.ts';
import { profiledPlayerIds } from '#lib/server/profiles.ts';

const LIMIT = 100;

/**
 * The player list behind the search page: fpa-api's players filtered by name
 * and, optionally, to those with a profile here. Filtering is in memory over a
 * cached directory, so it can run on every keystroke.
 */
export const findPlayers = query(
	v.object({
		q: v.pipe(v.string(), v.trim(), v.maxLength(100)),
		withProfile: v.boolean()
	}),
	async ({ q, withProfile }) => {
		requireEditor();
		const [players, profiled] = await Promise.all([allPlayers(), profiledPlayerIds()]);

		const needle = q.toLocaleLowerCase();
		const matches = players
			.filter((player) => !needle || player.fullName.toLocaleLowerCase().includes(needle))
			.filter((player) => !withProfile || profiled.has(player.id))
			.sort((a, b) => a.fullName.localeCompare(b.fullName));

		return {
			total: matches.length,
			players: matches.slice(0, LIMIT).map((player) => ({
				id: player.id,
				fullName: player.fullName,
				country: player.country,
				hasProfile: profiled.has(player.id)
			}))
		};
	}
);
