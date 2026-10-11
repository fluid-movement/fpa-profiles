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
  - components.json
  - src/routes/layout.css
confirmed_commit: 1a56aa7691effa6ac06ce28e6cc02d7b9f704441
---

This app follows fpa-events' conventions (see its `AGENTS.md`):

- **UI comes only from shadcn-svelte; write no custom components** (the user's rule). Add what is missing with `pnpm dlx shadcn-svelte@latest add <name> -y`; components land in `src/lib/components/ui/` and are imported as `#lib/components/ui/<name>/index.ts`. `components.json` uses the `#lib` aliases and the stone base color; the theme variables in `src/routes/layout.css` define a calm light theme (soft off-white page, pastel blue primary with dark text, text pairs WCAG AA); there is no dark mode or theme switch. **Check generated components against bits-ui 2.19**: the current registry styles state with `data-checked:`/`data-unchecked:` variants, but bits-ui 2.19 sets `data-state="checked"`, so those classes never match (the switch rendered invisible). Rewrite them as `data-[state=checked]:` (done in `switch` and `field-label`). Drive a stateful control from URL or remote state with a writable `$derived` plus `bind:checked`, as the player list's switch does. `init` needs an interactive preset choice, which is why the configuration was written by hand. Spread `fields.x.as(...)` straight onto `Input`, `Textarea` (without `type`) and `NativeSelect.Root`; show issues with `Field.Error errors={...}`.

- **Remote functions for server interactions.** `query()` and `form()` from `$app/server` in a `data.remote.ts` next to the route (or `src/lib/*.remote.ts` when shared, like `auth.remote.ts`). No `+page.server.ts` actions and no `use:enhance`; spreading the form onto `<form>` gives progressive enhancement, and the forms work without JavaScript. Remote functions are enabled with `experimental.remoteFunctions` in `vite.config.ts`, where Kit 3 takes its options (it refuses a `svelte.config.js`).
- **Every input comes from `form.fields.<name>.as(type, seed)`.** Kit rejects fields it did not build. The seed only initialises the value. There is no `textarea` type: spread `.as('text', seed)` without its `type` onto a `<textarea>`. Fields addressed by registry key are reached through `form.fields as Record<string, any>` (see the profile editor).
- **One form instance per record: `form.for(key)`.** A remote form instance keeps its last submitted values and `result`, and a field with a value ignores its `.as()` seed. On a route reused across records (`/players/[playerId]`), a shared instance therefore shows the previously saved record's data after navigating. The profile editor uses `saveProfile.for(editor.player.id)` and resets per-record local `$state` when the id changes ([editor pages](/features/editor-pages.md)).
- **Kit 3 `goto` options** are `replace` and `reset` (not `replaceState`/`keepFocus`/`noScroll`); `page.url.searchParams` is read-only, so copy `new URLSearchParams(page.url.search)` before editing.
- **Svelte 5 runes and async components** (`compilerOptions.experimental.async`): read queries with `$derived(await someQuery(arg))`.
- **Validation with valibot.** Remote form schemas check shape; domain rules live in plain modules (`normalizeFields`). Report domain errors with `invalid(issue.<field>(message))`, or `invalid(message)` for the whole form.
- **`#lib` subpath imports** with explicit `.ts` extensions (Kit 3 removed `$lib`), which also lets the plain-Node scripts import shared modules.
