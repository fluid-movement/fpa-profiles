import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { form, query } from '$app/server';
import { invalid } from '@sveltejs/kit';
import { requireEditor } from '#lib/server/authz.ts';
import { getPlayer, requestRefresh } from '#lib/server/fpa-api.ts';
import { getProfile, saveProfile as storeProfile } from '#lib/server/profiles.ts';
import { FIELDS, normalizeFields } from '#lib/profile/fields.ts';

export const getEditor = query(v.string(), async (playerId) => {
	requireEditor();
	const player = await getPlayer(playerId);
	if (!player) error(404, 'No such player in fpa-api');

	const profile = await getProfile(player.id);
	return {
		player: { id: player.id, fullName: player.fullName, country: player.country },
		fields: profile?.fields ?? {},
		updatedAt: profile?.updatedAt.toISOString() ?? null,
		updatedBy: profile?.updatedBy ?? null
	};
});

const optionalText = v.optional(v.string());

/**
 * The form's shape, derived from the field registry: text-like fields arrive
 * as strings, links as rows. This only checks the shape; `normalizeFields`
 * owns the real validation, so the editor form and the import share it.
 */
const ProfileForm = v.object({
	playerId: v.pipe(v.string(), v.minLength(1)),
	...Object.fromEntries(
		FIELDS.map((field) => [
			field.key,
			field.type === 'links'
				? // Deleted rows leave empty slots: indexes are never reused.
					v.optional(v.array(v.optional(v.object({ kind: optionalText, url: optionalText, label: optionalText }))))
				: optionalText
		])
	)
});

export const saveProfile = form(ProfileForm, async (data, issue) => {
	const editor = requireEditor();

	// Re-resolve on save: the id is stored canonical, and players are only ever
	// ones fpa-api knows.
	const player = await getPlayer(data.playerId);
	if (!player) invalid('This player no longer exists in fpa-api.');

	const { fields, issues } = normalizeFields(data as Record<string, unknown>);
	if (issues.length > 0) {
		const fieldIssue = issue as unknown as Record<string, (message: string) => never>;
		invalid(...issues.map((problem) => fieldIssue[problem.key](problem.message)));
	}

	// Usernames are required for editors; the id is a fallback for safety.
	await storeProfile(player.id, fields, editor.username ?? editor.id);
	await getEditor(data.playerId).refresh();
	void requestRefresh();

	return { saved: true };
});
