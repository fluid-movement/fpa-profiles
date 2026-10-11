---
type: feature
title: Legacy profile import
description: 'History of the one-off import of profiles from the old FPA WordPress site (run 2026-10-11, code removed): what it mapped, and what it left in the data (legacy_id, updated_by = import)'
status: draft
generated:
  by: claude-code/opus-5.5
  at: 2026-10-11T09:41:53Z
scope:
  - src/lib/server/db/schema.ts
confirmed_commit: 999d10512a57f6541f9cbde13c7e6e5a02d55b88
---

The old FPA WordPress site kept player profiles in the `wp_profiles` table (243 rows, 227 players). A one-off script seeded this app's profiles from a MySQL dump of that site. It ran in production on 2026-10-11 and was then removed together with its mapping code; it will not run again. The dump holds personal data (emails, plaintext passwords, PayPal records) and is not kept anywhere.

## What it did

- Kept the newest `wp_profiles` row per legacy player (16 players had two).
- Resolved each legacy `player_id` through fpa-api's `GET /players?fpaWebsiteId=`, which also searches duplicate records (for 127 of 227 players the legacy id sat on a duplicate). All 227 resolved.
- Mapped `nickname`, `short_headline` (else `headline`) → `headline`, `description` → `bio` as Markdown, `start_play_date` → `playingSince`, `how_started`, `career_highlights`, `fav_move`, `mentors`, `partners`, `other_fun` → `hobbies`, `media` + `appearances` → `media`, `sponsors`, `user_url` → website links, `sponsor_link` → a sponsor link; HTML converted, entities decoded, junk URLs dropped. Personal columns were never read.
- Validated everything through the [field registry](/components/profile-fields.md).

Result: 226 profiles (one legacy profile had nothing left to import), 8 junk URL values dropped. Production received them as plain `INSERT … ON CONFLICT DO NOTHING` rows dumped from the local import, not by running the script on the server.

## What it left in the data

- `profile.legacy_id`: the WordPress `wp_players.player_id` of imported profiles, for traceability. Never exported.
- `updated_by = 'import'` on imported profiles until an editor saves them.
