/**
 * Editor usernames: 3–30 characters, lowercase letters, digits, dots,
 * underscores and hyphens. Better Auth lowercases usernames, so they are
 * case-insensitive at sign-in.
 */
export const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;

/**
 * Better Auth's core user table requires a unique email. Editors have none, so
 * each gets this placeholder: unique per username, on a reserved domain that
 * can never receive mail, and never shown in the app.
 */
export function placeholderEmail(username: string): string {
	return `${username}@editors.invalid`;
}
