## The project

fpa-profiles is the editor for player profile enrichment in the FPA (Freestyle Players Association) ecosystem. Players come from the upstream data that fpa-api (`../fpa-api`) aggregates and serves as a public REST API; this app lets one authenticated editor (possibly more later) attach profile data to those existing players. It never creates players. A one-off import seeds profiles from the legacy FPA WordPress site dump. The app exposes a read-only JSON export that fpa-api pulls as another source, so the public API and fpa-events serve the profiles. The decision record lives in fpa-api, issue 01M4N2FFHKBV8MB99QJ3NQJ5EZ.

Today the repository is the `sv create` scaffold (SvelteKit 3 with TypeScript, Drizzle on Postgres via postgres.js, Better Auth with the email-and-password demo, Tailwind 4, Vitest with browser component tests). Local Postgres runs from `compose.yaml` (`pnpm db:start`), and the scaffold still contains `demo/` routes, a placeholder `task` table and `adapter-auto`.

## Proposed entries

Most entries come with the feature issues (data model, export contract, authentication, legacy import, deployment), each written by the issue that builds the thing. The bootstrap writes only what exists now.

### Area: Foundation

| Type | Path | Title | Description | Scope |
| --- | --- | --- | --- | --- |
| overview | /overview.md | fpa-profiles | Editor that enriches fpa-api's upstream players with profile data and exports it back to fpa-api | |
| decision | /decisions/separate-editor-app.md | Separate editor app on Postgres | Why profiles are edited in their own SvelteKit app with its own Postgres, and why fpa-api pulls a JSON export instead of sharing a database | `package.json`, `drizzle.config.ts`, `compose.yaml` |
