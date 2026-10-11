---
type: feature
title: Editor sign-in and accounts
description: Username-and-password sign-in through Better Auth's username plugin (no email; a placeholder fills Better Auth's required email column), the route guard, and the users script
status: draft
generated:
  by: claude-code/opus-5.5
  at: 2026-10-11T09:33:03Z
scope:
  - src/lib/server/auth.ts
  - src/lib/server/authz.ts
  - src/hooks.server.ts
  - src/lib/auth.remote.ts
  - scripts/users.ts
  - src/lib/usernames.ts
confirmed_commit: 17dc1a8203582dd8b13ab4fb7a24c322b8156d60
---

## Sign-in

Editors sign in with a **username and password**; the app has no email at all (no sign-up, verification or reset links). Better Auth (`src/lib/server/auth.ts`) runs its official `username` plugin, with `emailAndPassword` enabled only because it holds the password credential, and `disableSignUp: true`. Sign-in and sign-out are remote forms in `src/lib/auth.remote.ts` calling `auth.api.signInUsername` / `auth.api.signOut`; the `sveltekitCookies` plugin sets the cookie. The password field is `_password` so Kit never echoes it back. Saves record the editor's `username` as `profile.updated_by`.

Usernames (`src/lib/usernames.ts`): `USERNAME_PATTERN`, 3–30 of `a-z 0-9 . _ -`, also passed to the plugin as `usernameValidator`. The plugin lowercases usernames, so sign-in is case-insensitive.

**Better Auth still requires a unique `email` on every user** (a required core field; it cannot be switched off without forking). Editors get `placeholderEmail(username)`, `<username>@editors.invalid`, on a reserved domain that can never receive mail. It is never shown, asked for or used.

## Guard

`src/hooks.server.ts` loads the session into `locals.user`/`locals.session` (typed as `SessionUser`, which includes `username`) and redirects (307) every request without one to `/login`, except `/login`, `/export`, `/healthz`, `/api/auth/*` and `/_app/*`. Remote functions guard themselves with `requireEditor()` from `src/lib/server/authz.ts` (302, so a form POST lands on the login page as a GET). All editors have the same rights; there are no roles.

## Accounts from the terminal

`scripts/users.ts` (`pnpm users …` locally, `node scripts/users.ts …` in the container) is the only way to create or reset accounts: `list`, `create <username> [display name]`, `password <username>` (also deletes the editor's sessions), `remove <username>` (cascades to accounts and sessions). Passwords are generated and printed once unless `--password-stdin` is given (minimum 12 characters). It writes Better Auth's own rows, a `user` (with `username`, `display_username` and the placeholder email) plus a `credential` account, hashed with `hashPassword` from `better-auth/crypto`, so the app signs those editors in normally. It runs on Node's type stripping and imports `auth.schema.ts` and `usernames.ts`, which the Docker image copies for it ([Build and deployment](/components/deployment.md)).
