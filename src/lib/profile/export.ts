import { exportedFields, type ProfileFields } from './fields.ts';

/**
 * The export format: the contract with fpa-api, which pulls `GET /export`.
 * `version` changes only for breaking changes to this envelope; new fields
 * need no version change, because fpa-api validates values by type, not by key.
 */
export interface ProfileExport {
	version: 1;
	generatedAt: string;
	profiles: ExportedProfile[];
}

export interface ExportedProfile {
	playerId: string;
	updatedAt: string;
	fields: ProfileFields;
}

export function toExport(
	rows: { playerId: string; updatedAt: Date; fields: ProfileFields }[],
	now = new Date()
): ProfileExport {
	return {
		version: 1,
		generatedAt: now.toISOString(),
		profiles: rows
			.map((row) => ({
				playerId: row.playerId,
				updatedAt: row.updatedAt.toISOString(),
				fields: exportedFields(row.fields)
			}))
			// A profile whose every field is private has nothing to publish.
			.filter((row) => Object.keys(row.fields).length > 0)
			.sort((a, b) => a.playerId.localeCompare(b.playerId))
	};
}
