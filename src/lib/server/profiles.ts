import { eq, inArray } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { profile } from '#lib/server/db/schema.ts';
import type { ProfileFields } from '#lib/profile/fields.ts';
import { toExport, type ProfileExport } from '#lib/profile/export.ts';

export type Profile = typeof profile.$inferSelect;

export async function getProfile(playerId: string): Promise<Profile | null> {
	const [row] = await db.select().from(profile).where(eq(profile.playerId, playerId)).limit(1);
	return row ?? null;
}

/** Which of these players already have a profile, for marking search results. */
export async function profiledPlayerIds(playerIds: string[]): Promise<Set<string>> {
	if (playerIds.length === 0) return new Set();
	const rows = await db
		.select({ playerId: profile.playerId })
		.from(profile)
		.where(inArray(profile.playerId, playerIds));
	return new Set(rows.map((row) => row.playerId));
}

/** `fields` must already be normalized against the field registry. */
export async function saveProfile(playerId: string, fields: ProfileFields, updatedBy: string): Promise<void> {
	const now = new Date();
	await db
		.insert(profile)
		.values({ playerId, fields, updatedBy, createdAt: now, updatedAt: now })
		.onConflictDoUpdate({ target: profile.playerId, set: { fields, updatedBy, updatedAt: now } });
}

export async function buildExport(): Promise<ProfileExport> {
	const rows = await db
		.select({ playerId: profile.playerId, updatedAt: profile.updatedAt, fields: profile.fields })
		.from(profile);
	return toExport(rows);
}
