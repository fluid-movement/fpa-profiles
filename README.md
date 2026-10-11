# fpa-profiles

Editor for FPA player profiles. Players come from [fpa-api](https://github.com/fluid-movement/fpa-api); this app lets a signed-in editor add profile data (bio, nickname, career highlights, links and so on) to those existing players. It never creates players. fpa-api pulls the profiles from `GET /export` and serves them publicly.

## Development

```bash
pnpm install
cp .env.example .env   # point DATABASE_URL at a Postgres database
pnpm migrate           # apply the migrations in drizzle/
pnpm users create you@example.com "Your Name"   # prints a password
pnpm dev               # http://localhost:5173
```

fpa-api must be running (`FPA_API_URL`, default `http://localhost:3000`): player search and lookup come from it.

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server |
| `pnpm check` | Type check |
| `pnpm test` | Unit tests |
| `pnpm build` / `pnpm start` | Production build, then migrate and serve it |
| `pnpm migrate` | Apply pending migrations |
| `pnpm db:generate` | Generate a migration after changing `src/lib/server/db/schema.ts` |
| `pnpm users …` | Manage editor accounts (see below) |

## Profile fields

Fields are defined in one place, `src/lib/profile/fields.ts`. Each entry has a key, a label, a value type (`text`, `longtext`, `markdown`, `names`, `links`) and an `exported` flag. Values are stored in one `jsonb` column, so adding a field is one registry entry: no migration, and the form and export pick it up. Only `exported` fields are public.

## Editor accounts

There is no sign-up and the app sends no email. Accounts are managed from the terminal:

```bash
pnpm users list
pnpm users create <email> <name>    # prints a generated password
pnpm users password <email>         # new password; signs the editor out everywhere
pnpm users remove <email>
```

Add `--password-stdin` to `create` or `password` to supply the password yourself. In production, run the same script inside the container: `node scripts/users.ts list`.

## Deployment (Coolify)

Build pack **Dockerfile**, port `3000`, health check `/healthz`. The container applies migrations on start. Environment:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | This app's own Postgres database |
| `ORIGIN` | Public URL of the app |
| `BETTER_AUTH_SECRET` | 32+ random characters |
| `FPA_API_URL` | fpa-api base URL |
| `FPA_API_REFRESH_TOKEN` | Optional: fpa-api's `REFRESH_TOKEN`; saving then publishes immediately |
