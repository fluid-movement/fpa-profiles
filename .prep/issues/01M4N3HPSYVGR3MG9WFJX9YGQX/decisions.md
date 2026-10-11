## D1: Newest duplicate wins, never overwrite edited profiles
date: 2026-10-11

Of the 16 players with two legacy profile rows, the row with the higher profile_id wins: WordPress assigns ids in insertion order, so it is the newer submission. A player who already has a profile in the database is skipped unless --overwrite is passed, so re-running the import can never clobber an editor's work.

## D2: Add a sponsors text field
date: 2026-10-11

33 legacy profiles name sponsors without a sponsor link, and a link needs a URL, so the agreed fields would drop those names. A `sponsors` longtext field (exported) keeps them; a sponsor with a link also becomes a `sponsor` link. Adding a field is one registry entry (decision 01M4N3HPMTCYQ5MY1HB5FBSFXJ), so this costs nothing structurally.
