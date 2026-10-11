---
type: convention
title: SvelteKit conventions
description: 'Remote functions instead of form actions, fields.as() for every input, runes and async components, #lib imports, valibot; the same conventions as fpa-events'
status: draft
generated:
  by: claude-code/opus-5.5
  at: 2026-10-11T09:32:26Z
scope:
  - src/routes/**
  - src/lib/**/*.remote.ts
---

This app follows fpa-events' conventions (see its `AGENTS.md`):

- **Remote functions for server interactions.** `query()` and `form()` from `$app/server` in a `data.remote.ts` next to the route (or `src/lib/*.remote.ts` when shared, like `auth.remote.ts`). No `+page.server.ts` actions and no `use:enhance`; spreading the form onto `<form>` gives progressive enhancement, and the forms work without JavaScript. Remote functions are enabled with `experimental.remoteFunctions` in `vite.config.ts`, where Kit 3 takes its options (it refuses a `svelte.config.js`).
- **Every input comes from `form.fields.<name>.as(type, seed)`.** Kit rejects fields it did not build. The seed only initialises the value. There is no `textarea` type: spread `.as('text', seed)` without its `type` onto a `<textarea>`. Fields addressed by registry key are reached through `form.fields as Record<string, any>` (see the profile editor).
- **Svelte 5 runes and async components** (`compilerOptions.experimental.async`): read queries with `$derived(await someQuery(arg))`.
- **Validation with valibot.** Remote form schemas check shape; domain rules live in plain modules (`normalizeFields`). Report domain errors with `invalid(issue.<field>(message))`, or `invalid(message)` for the whole form.
- **`#lib` subpath imports** with explicit `.ts` extensions (Kit 3 removed `$lib`), which also lets the plain-Node scripts import shared modules.
