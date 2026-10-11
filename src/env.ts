import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	DATABASE_URL: { description: 'The database connection string.' },
	ORIGIN: {
		description: 'The app origin (base URL), e.g. `http://localhost:5173`.'
	},
	BETTER_AUTH_SECRET: {
		description: 'Secret used to sign tokens. For production use 32 characters generated with high entropy. See [Better Auth installation](https://www.better-auth.com/docs/installation).'
	},
	FPA_API_URL: {
		description: 'Base URL of fpa-api, where players are looked up, e.g. `http://localhost:3000`.',
		schema: (value) => (value ?? 'http://localhost:3000').replace(/\/+$/, '')
	},
	FPA_API_REFRESH_TOKEN: {
		description:
			"fpa-api's `REFRESH_TOKEN`. When set, saving a profile asks fpa-api to refresh so the change is public immediately; otherwise it appears on fpa-api's next scheduled refresh.",
		schema: (value) => value || undefined
	}
});
