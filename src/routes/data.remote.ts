import * as v from 'valibot';
import { query } from '$app/server';
import { requireEditor } from '#lib/server/authz.ts';
import { allPlayers } from '#lib/server/fpa-api.ts';
import { profiledPlayerIds } from '#lib/server/profiles.ts';
import { PAGE_SIZES } from '#lib/page-sizes.ts';


/**
 * The player list behind the search page: fpa-api's players filtered by name
 * and, optionally, to those with a profile here. Filtering is in memory over a
 * cached directory, so it can run on every keystroke.
 */
export const findPlayers = query(
	v.object({
		q: v.pipe(v.string(), v.trim(), v.maxLength(100)),
		withProfile: v.boolean(),
		page: v.pipe(v.number(), v.integer(), v.minValue(1)),
		size: v.picklist(PAGE_SIZES)
	}),
	async ({ q, withProfile, page, size }) => {
		requireEditor();
		const [players, profiled] = await Promise.all([allPlayers(), profiledPlayerIds()]);

		const needle = q.toLocaleLowerCase();
		const matches = players
			.filter((player) => !needle || player.fullName.toLocaleLowerCase().includes(needle))
			.filter((player) => !withProfile || profiled.has(player.id))
			.sort((a, b) => a.fullName.localeCompare(b.fullName));

		// An out-of-range page (a stale link, a shrunk result) lands on the last one.
		const pageCount = Math.max(1, Math.ceil(matches.length / size));
		const current = Math.min(page, pageCount);

		return {
			total: matches.length,
			page: current,
			pageCount,
			players: matches.slice((current - 1) * size, current * size).map((player) => ({
				id: player.id,
				fullName: player.fullName,
				country: player.country,
				hasProfile: profiled.has(player.id)
			}))
		};
	}
);
