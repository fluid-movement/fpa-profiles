import { describe, expect, it } from 'vitest';
import { placeholderEmail, USERNAME_PATTERN } from './usernames.ts';

describe('usernames', () => {
	it('accepts short lowercase handles and rejects anything else', () => {
		for (const name of ['andre', 'a.zaharias', 'editor_2', 'fpa-admin']) expect(USERNAME_PATTERN.test(name)).toBe(true);
		for (const name of ['ab', 'André', 'with space', 'me@example.com', 'x'.repeat(31)]) {
			expect(USERNAME_PATTERN.test(name)).toBe(false);
		}
	});

	it('derives a unique placeholder email on a domain that cannot receive mail', () => {
		expect(placeholderEmail('andre')).toBe('andre@editors.invalid');
	});
});
