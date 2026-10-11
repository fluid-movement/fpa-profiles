/**
 * Apply the committed Drizzle migrations in `drizzle/`. Runs before the server
 * starts in the container (see Dockerfile), and locally via `pnpm migrate`.
 *
 * Plain Node with type stripping, no build step, so it runs in the production
 * image as it is.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const client = postgres(url, { max: 1, onnotice: () => {} });
await migrate(drizzle(client), { migrationsFolder: new URL('../drizzle', import.meta.url).pathname });
await client.end();
console.log('[migrate] database is up to date');
