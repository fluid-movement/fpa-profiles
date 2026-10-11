import { describe, expect, it } from 'vitest';
import { FIELDS, exportedFields, normalizeFields } from './fields.ts';

describe('normalizeFields', () => {
	it('trims text, collapses single-line whitespace and drops empty values', () => {
		const { fields, issues } = normalizeFields({
			nickname: '  Laerbs ',
			headline: 'Player   of\nthe Year',
			bio: '\r\nFirst line\r\nSecond line\n',
			howStarted: '   ',
			partners: ''
		});

		expect(issues).toEqual([]);
		expect(fields).toEqual({
			nickname: 'Laerbs',
			headline: 'Player of the Year',
			bio: 'First line\nSecond line'
		});
	});

	it('ignores keys the registry does not define', () => {
		const { fields } = normalizeFields({ nickname: 'Laerbs', height: '6\' 1"', playerId: 'x' });
		expect(fields).toEqual({ nickname: 'Laerbs' });
	});

	it('keeps filled link rows, drops blank ones and omits empty labels', () => {
		const { fields, issues } = normalizeFields({
			links: [
				{ kind: 'website', url: ' https://example.com ', label: '' },
				{ kind: 'website', url: '', label: '' },
				{ kind: 'sponsor', url: 'https://rudyproject.com', label: 'Rudy Project' }
			]
		});

		expect(issues).toEqual([]);
		expect(fields.links).toEqual([
			{ kind: 'website', url: 'https://example.com' },
			{ kind: 'sponsor', url: 'https://rudyproject.com', label: 'Rudy Project' }
		]);
	});

	it('rejects a link without a scheme and an unknown link kind', () => {
		expect(normalizeFields({ links: [{ kind: 'website', url: 'coloradopowder.com' }] }).issues).toEqual([
			{ key: 'links', message: 'Must be a full URL, e.g. https://example.com' }
		]);
		expect(normalizeFields({ links: [{ kind: 'myspace', url: 'https://example.com' }] }).issues).toHaveLength(1);
		expect(normalizeFields({ links: [{ kind: 'website', url: 'ftp://example.com' }] }).issues).toHaveLength(1);
	});

	it('rejects text over the length limit', () => {
		const { fields, issues } = normalizeFields({ nickname: 'x'.repeat(201) });
		expect(fields).toEqual({});
		expect(issues).toEqual([{ key: 'nickname', message: 'At most 200 characters.' }]);
	});

	it('rejects a value of the wrong type', () => {
		expect(normalizeFields({ links: 'https://example.com' }).issues).toHaveLength(1);
	});
});

describe('exportedFields', () => {
	it('keeps only fields the registry marks as exported', () => {
		const privateField = FIELDS.find((field) => !field.exported);
		const input = { nickname: 'Laerbs', ...(privateField ? { [privateField.key]: 'secret' } : {}) };
		expect(exportedFields(input)).toEqual({ nickname: 'Laerbs' });
	});
});

describe('registry', () => {
	it('has unique keys', () => {
		const keys = FIELDS.map((field) => field.key);
		expect(new Set(keys).size).toBe(keys.length);
	});
});
