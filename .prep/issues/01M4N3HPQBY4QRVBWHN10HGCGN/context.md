Built on the decided shape (01M4N3HPMTCYQ5MY1HB5FBSFXJ): a field registry in `src/lib/profile/fields.ts` with five value types, one `profile` row per canonical player with a `jsonb` `fields` column, and `GET /export`. Follows the fpa-events conventions: remote functions (`form()`/`query()` in colocated `data.remote.ts`), every input built by `fields.<name>.as(...)`, Svelte 5 runes with async components, `#lib` imports, valibot for validation.

- Auth: Better Auth with `emailAndPassword.disableSignUp`; sign-in and sign-out are remote forms calling `auth.api`. `hooks.server.ts` guards every route except `/login`, `/export`, `/healthz` and `/api/auth`.
- Accounts: `scripts/users.ts` (run by Node 24's type stripping, so it works in the container without a build step) writes Better Auth's `user` and `account` rows with `hashPassword` from `better-auth/crypto`.
- Players come from fpa-api (`FPA_API_URL`): `/players?q=` for search, `/players/{id}` for the canonical id and name. After a save the app calls fpa-api `POST /refresh` with `FPA_API_REFRESH_TOKEN` when set.
- Migrations: drizzle-kit generates them into `drizzle/`; `scripts/migrate.ts` applies them at container start.
