---
type: component
title: Profile field registry and storage
description: Where profile fields are defined, the five value types, validation with normalizeFields, and the jsonb profile table; read before adding or changing a field
status: draft
generated:
  by: claude-code/opus-5.5
  at: 2026-10-11T09:33:03Z
scope:
  - src/lib/profile/fields.ts
  - src/lib/server/db/schema.ts
  - src/lib/server/profiles.ts
---

## Registry

`FIELDS` in `src/lib/profile/fields.ts` is the only definition of the profile fields: `key`, `label`, optional `help`, a value `type`, and `exported` (whether the field is public). The edit form (`src/routes/players/[playerId]/+page.svelte`), the save handler, the legacy import and the [export](/features/profile-export.md) all iterate it, so **adding a field is one entry**: no migration, no form or export change.

Value types, each with one schema in `VALUE_SCHEMAS`:

| Type | Value | Limit |
| --- | --- | --- |
| `text` | single line, whitespace collapsed | 200 chars |
| `longtext` | paragraphs, `\n` line endings | 5000 chars |
| `markdown` | formatted text (the bio) | 20000 chars |
| `names` | ordered list of names | 100 names; no v1 field uses it yet |
| `links` | ordered `{ kind, url, label? }`; `kind` in `LINK_KINDS` (`website`, `sponsor`, `social`, `other`); `url` must be http(s) | 20 links |

Personal fields (height, birthplace, residence, profession) are deliberately absent, as are photos (if added later, they go to an R2 bucket, not the app host).

## Validation

`normalizeFields(input)` is the single gate for stored values: it trims, drops empty values and blank link rows, ignores unknown keys, and validates each known field, returning `{ fields, issues }` with issues keyed by field. The form schema in the editor's `data.remote.ts` only checks the shape; `normalizeFields` owns the rules. `exportedFields(fields)` keeps only `exported` fields.

## Storage

Table `profile` (`src/lib/server/db/schema.ts`): `player_id` (text primary key, the canonical fpa-api player id at write time), `legacy_id` (the old WordPress `wp_players.player_id`, indexed, never exported), `fields` (`jsonb`, typed as `ProfileFields`), `created_at`, `updated_at`, `updated_by` (editor email, or `import`). Accessors live in `src/lib/server/profiles.ts` (`getProfile`, `profiledPlayerIds`, `saveProfile` as an upsert, `buildExport`).

Players themselves are never stored here; they come from fpa-api (`src/lib/server/fpa-api.ts`). See [Separate editor app on Postgres](/decisions/separate-editor-app.md).
