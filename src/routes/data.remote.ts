import * as v from 'valibot';
import { query } from '$app/server';
import { requireEditor } from '#lib/server/authz.ts';
import { searchPlayers } from '#lib/server/fpa-api.ts';
import { profiledPlayerIds } from '#lib/server/profiles.ts';

export const findPlayers = query(v.pipe(v.string(), v.trim(), v.maxLength(100)), async (q) => {
	requireEditor();
	const { items, total } = await searchPlayers(q);
	const profiled = await profiledPlayerIds(items.map((player) => player.id));
	return {
		total,
		players: items.map((player) => ({
			id: player.id,
			fullName: player.fullName,
			country: player.country,
			hasProfile: profiled.has(player.id)
		}))
	};
});
