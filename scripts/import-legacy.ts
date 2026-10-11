/**
 * One-off import of player profiles from the legacy FPA WordPress dump.
 *
 *   pnpm import:legacy <dump.sql> [--dry-run] [--overwrite]
 *
 * Reads only the `wp_profiles` rows of the dump, keeps the newest row per
 * legacy player, maps it with `mapLegacyProfile`, validates it with the field
 * registry, and resolves the legacy player id to a canonical player through
 * fpa-api (`GET /players?fpaWebsiteId=`, which also searches duplicate
 * records). Players fpa-api does not resolve to exactly one player are
 * reported and skipped, never guessed.
 *
 * Players who already have a profile are skipped unless --overwrite is given,
 * so a re-run never clobbers an editor's work. --dry-run reports without
 * writing. The dump holds personal data: keep it out of the repository.
 */
import { readFileSync } from 'node:fs';
import { inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { mapLegacyProfile, newestPerPlayer, type LegacyProfileRow } from '../src/lib/legacy/map.ts';
import { normalizeFields } from '../src/lib/profile/fields.ts';
import { profile } from '../src/lib/server/db/schema.ts';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const overwrite = args.includes('--overwrite');
const dumpPath = args.find((arg) => !arg.startsWith('--'));
if (!dumpPath) fail('usage: import-legacy <dump.sql> [--dry-run] [--overwrite]');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) fail('DATABASE_URL is not set');
const apiUrl = (process.env.FPA_API_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

const rows = newestPerPlayer(readTable(readFileSync(dumpPath, 'utf8'), 'wp_profiles') as unknown as LegacyProfileRow[]);
console.log(`[import] ${rows.length} legacy players with a profile${dryRun ? ' (dry run)' : ''}`);

const resolved = await resolvePlayers(rows.map((row) => String(row.player_id)));

const client = postgres(databaseUrl, { max: 1, onnotice: () => {} });
const db = drizzle(client);

const existing = new Set(
	(
		await db
			.select({ playerId: profile.playerId })
			.from(profile)
			.where(inArray(profile.playerId, [...resolved.values()].filter((id): id is string => typeof id === 'string')))
	).map((row) => row.playerId)
);

const report = { imported: 0, overwritten: 0, skippedExisting: 0, unresolved: [] as string[], empty: 0, notes: [] as string[] };

for (const row of rows) {
	const legacyId = String(row.player_id);
	const playerId = resolved.get(legacyId);
	if (typeof playerId !== 'string') {
		report.unresolved.push(`${legacyId} (${playerId})`);
		continue;
	}

	const mapped = mapLegacyProfile(row);
	const { fields, issues } = normalizeFields(mapped.input);
	for (const note of mapped.dropped) report.notes.push(`${legacyId}: ${note}`);
	for (const issue of issues) report.notes.push(`${legacyId}: ${issue.key} dropped, ${issue.message}`);

	if (Object.keys(fields).length === 0) {
		report.empty += 1;
		continue;
	}
	if (existing.has(playerId) && !overwrite) {
		report.skippedExisting += 1;
		continue;
	}

	if (!dryRun) {
		const now = new Date();
		await db
			.insert(profile)
			.values({ playerId, legacyId: mapped.legacyId, fields, updatedBy: 'import', createdAt: now, updatedAt: now })
			.onConflictDoUpdate({
				target: profile.playerId,
				set: { legacyId: mapped.legacyId, fields, updatedBy: 'import', updatedAt: now }
			});
	}
	if (existing.has(playerId)) report.overwritten += 1;
	else report.imported += 1;
}

await client.end();

const verb = dryRun ? 'would import' : 'imported';
console.log(`[import] ${verb} ${report.imported}, overwrote ${report.overwritten}, skipped ${report.skippedExisting} existing (use --overwrite), ${report.empty} with nothing to import`);
if (report.unresolved.length > 0) console.log(`[import] unresolved legacy ids: ${report.unresolved.join(', ')}`);
if (report.notes.length > 0) {
	console.log(`[import] ${report.notes.length} value(s) not carried over:`);
	for (const note of report.notes) console.log(`  ${note}`);
}

/** Legacy id -> canonical player id, or a reason string when it is not exactly one player. */
async function resolvePlayers(legacyIds: string[]): Promise<Map<string, string>> {
	const result = new Map<string, string>();
	const queue = [...legacyIds];
	await Promise.all(
		Array.from({ length: 6 }, async () => {
			for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
				const response = await fetch(`${apiUrl}/players?fpaWebsiteId=${encodeURIComponent(id)}&limit=2`);
				if (!response.ok) fail(`fpa-api answered ${response.status}; is it running at ${apiUrl} and loaded?`);
				const page = (await response.json()) as { items: { id: string }[]; total: number };
				result.set(id, page.total === 1 ? page.items[0]!.id : page.total === 0 ? 'no player' : `${page.total} players`);
			}
		})
	);
	return result;
}

/**
 * Rows of one table from a mysqldump/phpMyAdmin dump: its column list from
 * CREATE TABLE, values from its INSERT statements. Handles quoted strings with
 * backslash and doubled-quote escapes, NULL and bare numbers.
 */
function readTable(dump: string, table: string): Record<string, unknown>[] {
	const create = new RegExp('CREATE TABLE `' + table + '` \\(([\\s\\S]*?)\\n\\)').exec(dump);
	if (!create) fail(`table ${table} not found in the dump`);
	const defaultColumns = [...create[1]!.matchAll(/^\s+`(\w+)`/gm)].map((match) => match[1]!);

	const rows: Record<string, unknown>[] = [];
	const insert = new RegExp('INSERT INTO `' + table + '` (?:\\(([^)]*)\\) )?VALUES', 'g');
	for (const match of dump.matchAll(insert)) {
		const columns = match[1] ? match[1].split(',').map((column) => column.trim().replace(/`/g, '')) : defaultColumns;
		for (const values of parseValues(dump, match.index + match[0].length)) {
			rows.push(Object.fromEntries(columns.map((column, i) => [column, values[i]])));
		}
	}
	return rows;
}

function parseValues(text: string, start: number): unknown[][] {
	const escapes: Record<string, string> = { n: '\n', r: '\r', t: '\t', '0': '\0', Z: '\x1a' };
	const tuples: unknown[][] = [];
	let i = start;

	while (i < text.length && text[i] !== ';') {
		if (text[i] !== '(') {
			i++;
			continue;
		}
		i++;
		const tuple: unknown[] = [];
		for (;;) {
			while (text[i] === ' ' || text[i] === '\n') i++;
			if (text[i] === "'") {
				i++;
				let value = '';
				for (;;) {
					const char = text[i]!;
					if (char === '\\') {
						value += escapes[text[i + 1]!] ?? text[i + 1];
						i += 2;
					} else if (char === "'") {
						if (text[i + 1] === "'") {
							value += "'";
							i += 2;
						} else {
							i++;
							break;
						}
					} else {
						value += char;
						i++;
					}
				}
				tuple.push(value);
			} else {
				let end = i;
				while (text[end] !== ',' && text[end] !== ')') end++;
				const token = text.slice(i, end).trim();
				tuple.push(token === 'NULL' ? null : /^-?\d+(\.\d+)?$/.test(token) ? Number(token) : token);
				i = end;
			}
			while (text[i] === ' ' || text[i] === '\n') i++;
			if (text[i] === ',') {
				i++;
				continue;
			}
			i++; // ')'
			break;
		}
		tuples.push(tuple);
	}
	return tuples;
}

function fail(message: string): never {
	console.error(`import: ${message}`);
	process.exit(1);
}
