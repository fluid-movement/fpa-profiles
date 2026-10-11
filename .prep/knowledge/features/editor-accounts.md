---
type: feature
title: Editor sign-in and accounts
description: Better Auth email and password with sign-up disabled, the route guard, and the users script that creates and resets editors from the terminal
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
confirmed_commit: 17dc1a8203582dd8b13ab4fb7a24c322b8156d60
---

## Sign-in

Better Auth (`src/lib/server/auth.ts`) with email and password and `disableSignUp: true`. The app sends no email: no verification, no reset links. Sign-in and sign-out are remote forms in `src/lib/auth.remote.ts` that call `auth.api.signInEmail` / `auth.api.signOut`; the `sveltekitCookies` plugin sets the cookie. The password field is `_password` so Kit never echoes it back.

## Guard

`src/hooks.server.ts` loads the session into `locals.user`/`locals.session` and redirects (307) every request without one to `/login`, except `/login`, `/export`, `/healthz`, `/api/auth/*` and `/_app/*`. Remote functions guard themselves with `requireEditor()` from `src/lib/server/authz.ts` (302, so a form POST lands on the login page as a GET). All editors have the same rights; there are no roles.

## Accounts from the terminal

`scripts/users.ts` (`pnpm users …` locally, `node scripts/users.ts …` in the container) is the only way to create or reset accounts: `list`, `create <email> <name>`, `password <email>` (also deletes the editor's sessions), `remove <email>` (cascades to accounts and sessions). Passwords are generated and printed once unless `--password-stdin` is given (minimum 12 characters). It writes Better Auth's own rows, a `user` plus a `credential` account, hashed with `hashPassword` from `better-auth/crypto`, so the app signs those editors in normally. It runs on Node's type stripping and imports only `auth.schema.ts`, which the Docker image copies for it ([Build and deployment](/components/deployment.md)).
