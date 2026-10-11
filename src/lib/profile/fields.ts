import * as v from 'valibot';

/**
 * The profile field registry: the single place that says which profile fields
 * exist, how they are edited, how they are validated, and whether they are
 * public.
 *
 * Values are stored in one `jsonb` column, so adding a field is one entry here:
 * no migration, and the edit form and the export pick it up. A field with
 * `exported: false` is editable but never leaves this app.
 */

export type ValueType = 'text' | 'longtext' | 'markdown' | 'names' | 'links';

export const LINK_KINDS = ['website', 'sponsor', 'social', 'other'] as const;
export type LinkKind = (typeof LINK_KINDS)[number];

export interface Link {
	kind: LinkKind;
	url: string;
	label?: string;
}

export type FieldValue = string | string[] | Link[];

/** Stored and exported profile values, keyed by field key. Empty values are absent. */
export type ProfileFields = Record<string, FieldValue>;

export interface FieldDefinition {
	key: string;
	label: string;
	help?: string;
	type: ValueType;
	/** Whether the field appears in the public export. */
	exported: boolean;
}

export const FIELDS: readonly FieldDefinition[] = [
	{ key: 'nickname', label: 'Nickname', type: 'text', exported: true },
	{
		key: 'headline',
		label: 'Headline',
		help: 'One line that sums the player up.',
		type: 'text',
		exported: true
	},
	{ key: 'bio', label: 'Biography', help: 'Markdown.', type: 'markdown', exported: true },
	{
		key: 'playingSince',
		label: 'Playing since',
		help: 'Usually a year.',
		type: 'text',
		exported: true
	},
	{ key: 'howStarted', label: 'How they started', type: 'longtext', exported: true },
	{ key: 'careerHighlights', label: 'Career highlights', type: 'longtext', exported: true },
	{ key: 'favoriteMove', label: 'Favorite move', type: 'longtext', exported: true },
	{ key: 'mentors', label: 'Mentors', type: 'longtext', exported: true },
	{ key: 'partners', label: 'Partners', type: 'longtext', exported: true },
	{ key: 'hobbies', label: 'Other interests', type: 'longtext', exported: true },
	{
		key: 'media',
		label: 'Media and appearances',
		help: 'Press coverage, TV, shows.',
		type: 'longtext',
		exported: true
	},
	{ key: 'links', label: 'Links', help: 'Website, sponsors, social profiles.', type: 'links', exported: true }
];

const MAX_LENGTH: Record<Exclude<ValueType, 'names' | 'links'>, number> = {
	text: 200,
	longtext: 5000,
	markdown: 20000
};

export const MAX_LINKS = 20;

const httpUrl = v.pipe(
	v.string(),
	v.trim(),
	v.url('Must be a full URL, e.g. https://example.com'),
	v.check((url) => /^https?:\/\//i.test(url), 'Must start with http:// or https://')
);

const linkSchema = v.object({
	kind: v.picklist(LINK_KINDS, 'Pick a link type.'),
	url: httpUrl,
	label: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(100, 'At most 100 characters.')))
});

/** The schema each value type's stored value must satisfy. */
export const VALUE_SCHEMAS = {
	text: v.pipe(v.string(), v.maxLength(MAX_LENGTH.text, `At most ${MAX_LENGTH.text} characters.`)),
	longtext: v.pipe(v.string(), v.maxLength(MAX_LENGTH.longtext, `At most ${MAX_LENGTH.longtext} characters.`)),
	markdown: v.pipe(v.string(), v.maxLength(MAX_LENGTH.markdown, `At most ${MAX_LENGTH.markdown} characters.`)),
	names: v.pipe(v.array(v.pipe(v.string(), v.minLength(1))), v.maxLength(100)),
	links: v.pipe(v.array(linkSchema), v.maxLength(MAX_LINKS, `At most ${MAX_LINKS} links.`))
} satisfies Record<ValueType, v.GenericSchema>;

export interface FieldIssue {
	key: string;
	message: string;
}

/**
 * Turn loosely shaped input (a form submission, an import row) into stored
 * profile values: trims text, drops empty values and empty link rows, and
 * validates every known field against its type. Unknown keys are ignored.
 */
export function normalizeFields(input: Record<string, unknown>): {
	fields: ProfileFields;
	issues: FieldIssue[];
} {
	const fields: ProfileFields = {};
	const issues: FieldIssue[] = [];

	for (const definition of FIELDS) {
		const value = clean(definition.type, input[definition.key]);
		if (value === undefined) continue;

		const result = v.safeParse(VALUE_SCHEMAS[definition.type], value);
		if (result.success) {
			fields[definition.key] = result.output as FieldValue;
		} else {
			issues.push({ key: definition.key, message: result.issues[0].message });
		}
	}

	return { fields, issues };
}

function clean(type: ValueType, raw: unknown): unknown {
	if (raw === undefined || raw === null) return undefined;

	switch (type) {
		case 'text':
			return nonEmpty(typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim() : raw);
		case 'longtext':
		case 'markdown':
			return nonEmpty(typeof raw === 'string' ? raw.replace(/\r\n?/g, '\n').trim() : raw);
		case 'names': {
			if (!Array.isArray(raw)) return raw;
			const names = raw.map((name) => (typeof name === 'string' ? name.trim() : name)).filter((name) => name !== '');
			return names.length > 0 ? names : undefined;
		}
		case 'links': {
			if (!Array.isArray(raw)) return raw;
			const links = raw
				.filter((link): link is Record<string, unknown> => typeof link === 'object' && link !== null)
				.map((link) => ({
					kind: link.kind,
					url: typeof link.url === 'string' ? link.url.trim() : link.url,
					label: typeof link.label === 'string' && link.label.trim() !== '' ? link.label.trim() : undefined
				}))
				// A row with neither a URL nor a label is an unused form row, not an error.
				.filter((link) => (link.url !== undefined && link.url !== '') || link.label !== undefined)
				.map(({ label, ...link }) => (label === undefined ? link : { ...link, label }));
			return links.length > 0 ? links : undefined;
		}
	}
}

function nonEmpty(value: unknown): unknown {
	return value === '' ? undefined : value;
}

/** The subset of stored values that is public. */
export function exportedFields(fields: ProfileFields): ProfileFields {
	const exported: ProfileFields = {};
	for (const definition of FIELDS) {
		if (definition.exported && fields[definition.key] !== undefined) {
			exported[definition.key] = fields[definition.key];
		}
	}
	return exported;
}
