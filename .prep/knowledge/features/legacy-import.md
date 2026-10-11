---
type: feature
title: Legacy profile import
description: 'One-off import of player profiles from the old FPA WordPress dump: matching through fpa-api, field mapping, HTML conversion, and running it safely (dry run, no overwrites)'
status: draft
generated:
  by: claude-code/opus-5.5
  at: 2026-10-11T09:41:53Z
scope:
  - src/lib/legacy/map.ts
  - scripts/import-legacy.ts
confirmed_commit: 17dc1a8203582dd8b13ab4fb7a24c322b8156d60
---

The old FPA WordPress site kept player profiles in the `wp_profiles` table (243 rows, 227 players). `scripts/import-legacy.ts` seeds this app's profiles from a MySQL dump of that site. It is a script, not a database migration, and it is idempotent: re-running it changes nothing unless `--overwrite` is passed.

```bash
pnpm import:legacy <dump.sql> --dry-run    # report only
pnpm import:legacy <dump.sql>              # write; skips players that already have a profile
```

In production, copy the dump into the container (or mount it) and run `node scripts/import-legacy.ts /path/to/dump.sql`; `FPA_API_URL` must reach a loaded fpa-api. **The dump holds personal data (emails, plaintext passwords, PayPal records): never commit it or leave it on a server.**

## How it works

1. Parses only the `wp_profiles` INSERT statements (a small mysqldump parser in the script) and keeps the newest row per legacy player (highest `profile_id`; 16 players have two).
2. Resolves each legacy `player_id` through fpa-api's `GET /players?fpaWebsiteId=`, which searches duplicate records too; that matters because for 127 of 227 players the legacy id sits on a duplicate upstream record. Anything other than exactly one player is reported and skipped. On 2026-10-11 all 227 resolved.
3. `mapLegacyProfile` (`src/lib/legacy/map.ts`, unit-tested) maps the agreed columns: `nickname`, `short_headline` (else `headline`) → `headline`, `description` → `bio` as Markdown, `start_play_date` → `playingSince`, `how_started`, `career_highlights`, `fav_move`, `mentors`, `partners`, `other_fun` → `hobbies`, `media` + `appearances` → `media`, `sponsors` → `sponsors`, `user_url` (comma-separated lists split) → website links, `sponsor_link` → a sponsor link. URLs without a scheme get `https://`; non-URLs ("n/a", "Facebook") are reported and dropped. HTML is converted and entities decoded (Czech names use numeric entities).
4. The result goes through `normalizeFields` ([field registry](/components/profile-fields.md)); invalid values are dropped per field and reported. Rows are written with `legacy_id` and `updated_by = 'import'`.

Personal columns (`user_email`, `user_pass`, height, birthplace, residence, profession), video links and display state are never read into the result; a unit test asserts that.

## Result of the first run (local, 2026-10-11)

226 profiles imported, one legacy profile had nothing left to import, 8 junk URL values dropped.
