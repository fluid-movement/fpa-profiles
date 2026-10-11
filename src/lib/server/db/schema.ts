import { index, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type { ProfileFields } from '../../profile/fields.ts';

/**
 * One row per enriched player. `player_id` is the canonical upstream player id
 * from fpa-api at the time of writing; fpa-api resolves it through its alias
 * map when serving, so an upstream merge later does not orphan the profile.
 * `fields` holds the values described by the field registry
 * (`#lib/profile/fields.ts`), validated on every write.
 */
export const profile = pgTable(
	'profile',
	{
		playerId: text('player_id').primaryKey(),
		/** `wp_players.player_id` on the legacy WordPress site, for traceability. Not exported. */
		legacyId: integer('legacy_id'),
		fields: jsonb('fields').$type<ProfileFields>().notNull().default({}),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
		/** Email of the editor who last saved, or `import` for the legacy import. */
		updatedBy: text('updated_by').notNull()
	},
	(table) => [index('profile_legacy_id_idx').on(table.legacyId)]
);

export * from './auth.schema.ts';
