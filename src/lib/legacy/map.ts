import type { Link } from '../profile/fields.ts';

/**
 * Maps one row of the legacy WordPress `wp_profiles` table to profile field
 * input (decision 01M4N3HPMTCYQ5MY1HB5FBSFXJ). The result still goes through
 * `normalizeFields`, which owns validation.
 *
 * Only the columns named here are read. Personal data (`user_email`,
 * `user_pass`, height, birthplace, residence, profession), video links and the
 * legacy site's display state are never touched.
 */

export interface LegacyProfileRow {
	profile_id: number | string;
	player_id: number | string;
	nickname?: string | null;
	short_headline?: string | null;
	headline?: string | null;
	description?: string | null;
	start_play_date?: string | null;
	how_started?: string | null;
	career_highlights?: string | null;
	fav_move?: string | null;
	mentors?: string | null;
	partners?: string | null;
	other_fun?: string | null;
	media?: string | null;
	appearances?: string | null;
	sponsors?: string | null;
	sponsor_link?: string | null;
	user_url?: string | null;
}

export interface MappedProfile {
	legacyId: number;
	input: Record<string, unknown>;
	/** Values that could not be carried over, for the import report. */
	dropped: string[];
}

export function mapLegacyProfile(row: LegacyProfileRow): MappedProfile {
	const dropped: string[] = [];
	const links: Link[] = [];

	// Some players listed several sites in the one field, comma-separated.
	for (const part of splitList(row.user_url)) {
		const website = toUrl(part);
		if (website) links.push({ kind: 'website', url: website });
		else dropped.push(`website "${part}" is not a URL`);
	}

	const sponsors = plain(row.sponsors);
	const sponsorUrl = toUrl(row.sponsor_link);
	if (sponsorUrl) {
		links.push({
			kind: 'sponsor',
			url: sponsorUrl,
			...(sponsors && sponsors.length <= 100 ? { label: sponsors } : {})
		});
	} else if (present(row.sponsor_link)) {
		dropped.push(`sponsor link "${row.sponsor_link}" is not a URL`);
	}

	return {
		legacyId: Number(row.player_id),
		input: {
			nickname: plain(row.nickname),
			headline: plain(row.short_headline) || plain(row.headline),
			bio: htmlToMarkdown(row.description),
			playingSince: plain(row.start_play_date),
			howStarted: plain(row.how_started),
			careerHighlights: plain(row.career_highlights),
			favoriteMove: plain(row.fav_move),
			mentors: plain(row.mentors),
			partners: plain(row.partners),
			hobbies: plain(row.other_fun),
			media: [plain(row.media), plain(row.appearances)].filter(Boolean).join('\n\n'),
			sponsors,
			links
		},
		dropped
	};
}

/**
 * Of several rows for one player, the one with the highest `profile_id` is the
 * newest submission (WordPress assigns ids in insertion order).
 */
export function newestPerPlayer<T extends LegacyProfileRow>(rows: T[]): T[] {
	const newest = new Map<string, T>();
	for (const row of rows) {
		const key = String(row.player_id);
		const current = newest.get(key);
		if (!current || Number(row.profile_id) > Number(current.profile_id)) newest.set(key, row);
	}
	return [...newest.values()];
}

function splitList(value: string | null | undefined): string[] {
	if (!present(value)) return [];
	return value
		.split(',')
		.map((part) => part.trim())
		.filter(Boolean);
}

function present(value: string | null | undefined): value is string {
	return typeof value === 'string' && value.trim() !== '';
}

/**
 * A legacy URL field, usually typed without a scheme ("berlin-jammers.de").
 * Values that are not a host name at all ("Facebook", "/") return undefined.
 */
export function toUrl(value: string | null | undefined): string | undefined {
	if (!present(value)) return undefined;
	const trimmed = decodeEntities(value.trim());
	const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
	try {
		const url = new URL(candidate);
		if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(url.hostname)) return undefined;
		// URL already lowercases the host; drop the bare trailing slash it adds.
		const path = url.pathname === '/' && !url.search && !url.hash ? '' : `${url.pathname}${url.search}${url.hash}`;
		return `${url.protocol}//${url.host}${path}`;
	} catch {
		return undefined;
	}
}

/** Plain text: tags removed (line breaks kept), entities decoded, whitespace tidied. */
export function plain(value: string | null | undefined): string {
	if (!present(value)) return '';
	return tidy(
		decodeEntities(
			value
				.replace(/<br\s*\/?>/gi, '\n')
				.replace(/<\/p>/gi, '\n\n')
				.replace(/<[^>]+>/g, '')
		)
	);
}

/** The bio: links, emphasis and paragraphs become Markdown, other tags are dropped. */
export function htmlToMarkdown(value: string | null | undefined): string {
	if (!present(value)) return '';
	return tidy(
		decodeEntities(
			value
				.replace(/<a\s[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_match, href, text) => {
					const label = text.replace(/<[^>]+>/g, '').trim();
					const url = toUrl(href);
					if (!url) return label;
					return label && label !== href ? `[${label}](${url})` : `<${url}>`;
				})
				.replace(/<(b|strong)>([\s\S]*?)<\/\1>/gi, '**$2**')
				.replace(/<(i|em)>([\s\S]*?)<\/\1>/gi, '*$2*')
				.replace(/<br\s*\/?>/gi, '\n')
				.replace(/<\/p>/gi, '\n\n')
				.replace(/<[^>]+>/g, '')
		)
	);
}

const NAMED_ENTITIES: Record<string, string> = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: ' '
};

export function decodeEntities(value: string): string {
	return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
		if (entity[0] === '#') {
			const code = entity[1]?.toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
			return Number.isFinite(code) ? String.fromCodePoint(code) : match;
		}
		return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
	});
}

function tidy(value: string): string {
	return value
		.replace(/\r\n?/g, '\n')
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}
