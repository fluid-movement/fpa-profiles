## D1: Answers from the user
date: 2026-10-11

2026-10-11:

- Personal fields (height, birthplace, residence city/state/country, profession) are left out for now. The system must make adding fields later cheap.
- Photos are out of scope. If added later, they will live in an R2 bucket, not on the Coolify host.
- Legacy video links (dead `.wmv` hosts) are dropped.
- Editors are managed from the terminal over SSH; the app sends no email. The exact mechanism belongs to the editor issue.

## D2: Field registry with a typed JSON value column
date: 2026-10-11

Fields are defined once, in a code registry (`src/lib/profile/fields.ts`): key, label, help text, value type, and whether the field is exported. Each value type has one Zod schema, one form control and one export shape:

- `text`: a single line
- `longtext`: a paragraph, plain text
- `markdown`: formatted text (only the bio)
- `names`: an ordered list of names
- `links`: an ordered list of `{ kind, url, label }`, with `kind` one of `website`, `sponsor`, `social`, `other`

Storage is one row per player: `profile(player_id text primary key, legacy_id integer null, fields jsonb not null, created_at, updated_at, updated_by)`. `fields` maps field keys to values and is validated against the registry on every write. Adding a field is one registry entry: no database migration, and the form and export pick it up.

Rejected: a column per field, which needs a migration plus form and export changes for every field; and an entity-attribute-value table, which loses per-field typing and makes reads awkward for no gain at this size.

`player_id` is the canonical upstream player id at write time. fpa-api resolves it through its alias map when serving, so a later upstream merge does not orphan a profile. Profiles whose player no longer exists are flagged, never dropped.

## D3: Version 1 fields
date: 2026-10-11

Exported, mapped from `wp_profiles`:

| Key | Type | Legacy source |
| --- | --- | --- |
| `nickname` | text | `nickname` |
| `headline` | text | `short_headline`, else `headline` |
| `bio` | markdown | `description` (HTML converted) |
| `playingSince` | text | `start_play_date` |
| `howStarted` | longtext | `how_started` |
| `careerHighlights` | longtext | `career_highlights` |
| `favoriteMove` | longtext | `fav_move` |
| `mentors` | names | `mentors`, split on commas |
| `partners` | names | `partners`, split on commas |
| `hobbies` | longtext | `other_fun` |
| `media` | longtext | `media` and `appearances`, joined |
| `links` | links | `user_url` → website, `sponsors` + `sponsor_link` → sponsor |

Not imported: email, password, height, birthplace, residence, profession, video links, and the legacy site's display and ranking state (`rank`, `majors`, `display_*`, `*_display_order`, `show_profile_week`, `reviewed`). `legacy_id` keeps `wp_players.player_id` for traceability and is not exported.

## D4: Export format
date: 2026-10-11

`GET /export` (no authentication; it holds only exported fields) returns:

```json
{
  "version": 1,
  "generatedAt": "2026-10-11T12:00:00.000Z",
  "profiles": [
    {
      "playerId": "045f2b1a-…",
      "updatedAt": "2026-10-11T11:58:00.000Z",
      "fields": { "nickname": "Laerbs", "mentors": ["Skippy Jammer"], "links": [{ "kind": "website", "url": "https://…", "label": "coloradopowder.com" }] }
    }
  ]
}
```

Only fields marked exported appear, and empty values are omitted. fpa-api validates `fields` generically: a record from key to one of the five value shapes, not a fixed key list. So a new field flows through to the public API without an fpa-api release, and what is public stays a single decision, made in the registry. `version` changes only for breaking changes to this envelope.

## D5: Version 1 fields (final)
date: 2026-10-11
supersedes: D3
outcome: true

Agreed with the user on 2026-10-11. As D3, except that `mentors` and `partners` are `longtext`, so the legacy text migrates unchanged; turning them into name lists is a low-priority follow-up. With D2 (registry, storage) and D4 (export format) this is the decision.

| Key | Type | Legacy source |
| --- | --- | --- |
| `nickname` | text | `nickname` |
| `headline` | text | `short_headline`, else `headline` |
| `bio` | markdown | `description` (HTML converted) |
| `playingSince` | text | `start_play_date` |
| `howStarted` | longtext | `how_started` |
| `careerHighlights` | longtext | `career_highlights` |
| `favoriteMove` | longtext | `fav_move` |
| `mentors` | longtext | `mentors` |
| `partners` | longtext | `partners` |
| `hobbies` | longtext | `other_fun` |
| `media` | longtext | `media` and `appearances`, joined |
| `links` | links | `user_url` → website, `sponsors` + `sponsor_link` → sponsor |

The `names` value type stays defined for the follow-up but no v1 field uses it.
