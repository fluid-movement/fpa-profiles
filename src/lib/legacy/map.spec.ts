import { describe, expect, it } from 'vitest';
import { normalizeFields } from '../profile/fields.ts';
import { decodeEntities, htmlToMarkdown, mapLegacyProfile, newestPerPlayer, plain, toUrl } from './map.ts';

// Every input below is shaped like a real value in the legacy wp_profiles table.

describe('toUrl', () => {
	it('adds the scheme legacy values usually lack and tidies the host', () => {
		expect(toUrl('berlin-jammers.de/')).toBe('https://berlin-jammers.de');
		expect(toUrl('WWW.SPINCOLLECTIF.COM')).toBe('https://www.spincollectif.com');
		expect(toUrl('www.bigdogs.com/')).toBe('https://www.bigdogs.com');
		expect(toUrl('http://example.com/players/1')).toBe('http://example.com/players/1');
	});

	it('rejects values that are not a host name', () => {
		expect(toUrl('/')).toBeUndefined();
		expect(toUrl('Facebook')).toBeUndefined();
		expect(toUrl('SECRET NUMBER...Slap...SECRET NUMBER')).toBeUndefined();
		expect(toUrl('')).toBeUndefined();
		expect(toUrl(null)).toBeUndefined();
	});
});

describe('text conversion', () => {
	it('decodes the numeric entities used for Czech names', () => {
		expect(decodeEntities('Dit&#283; &amp; Vojt&#283;ch')).toBe('Ditě & Vojtěch');
	});

	it('strips tags to plain text but keeps line breaks', () => {
		expect(plain('<i>ESPN</i>, <nobr>MTV Europe</nobr><br>NFL &amp; NBA')).toBe('ESPN, MTV Europe\nNFL & NBA');
	});

	it('converts bio HTML to Markdown', () => {
		expect(htmlToMarkdown('See <a href="www.example.com">my site</a> and <b>this</b>\r\n\r\n\r\nnext')).toBe(
			'See [my site](https://www.example.com) and **this**\n\nnext'
		);
	});
});

describe('mapLegacyProfile', () => {
	const row = {
		profile_id: 7,
		player_id: '1048',
		nickname: 'Laerbs',
		short_headline: '2002 Men\'s Player of the Year',
		description: 'Larry Imperiale is one of the legends of freestyle.',
		start_play_date: '1978',
		media: '<i>ESPN</i>',
		appearances: 'NFL, NBA',
		sponsors: 'Rudy Project - Technically cool eyewear',
		sponsor_link: 'www.rudyprojectusa.com',
		user_url: 'coloradopowder.com',
		// Never read: these must not reach the result.
		user_email: 'someone@example.com',
		user_pass: '561709',
		height: '6\' 1"'
	};

	it('maps the agreed fields and produces valid profile input', () => {
		const mapped = mapLegacyProfile(row);
		expect(mapped.legacyId).toBe(1048);
		expect(mapped.dropped).toEqual([]);

		const { fields, issues } = normalizeFields(mapped.input);
		expect(issues).toEqual([]);
		expect(fields).toEqual({
			nickname: 'Laerbs',
			headline: "2002 Men's Player of the Year",
			bio: 'Larry Imperiale is one of the legends of freestyle.',
			playingSince: '1978',
			media: 'ESPN\n\nNFL, NBA',
			sponsors: 'Rudy Project - Technically cool eyewear',
			links: [
				{ kind: 'website', url: 'https://coloradopowder.com' },
				{ kind: 'sponsor', url: 'https://www.rudyprojectusa.com', label: 'Rudy Project - Technically cool eyewear' }
			]
		});
	});

	it('never carries personal data into the profile', () => {
		const serialized = JSON.stringify(mapLegacyProfile(row));
		expect(serialized).not.toContain('someone@example.com');
		expect(serialized).not.toContain('561709');
		expect(serialized).not.toContain('6\' 1"');
	});

	it('falls back to the long headline and reports unusable URLs', () => {
		const mapped = mapLegacyProfile({ profile_id: 1, player_id: 2, headline: 'Invented the move', user_url: 'Facebook' });
		expect(mapped.input.headline).toBe('Invented the move');
		expect(mapped.input.links).toEqual([]);
		expect(mapped.dropped).toEqual(['website "Facebook" is not a URL']);
	});
});

describe('website lists', () => {
	it('turns a comma-separated list of sites into one link each', () => {
		const mapped = mapLegacyProfile({ profile_id: 1, player_id: 2, user_url: 'www.fraktalorg.de, www.youtube.com/user/fraktalorg' });
		expect(mapped.input.links).toEqual([
			{ kind: 'website', url: 'https://www.fraktalorg.de' },
			{ kind: 'website', url: 'https://www.youtube.com/user/fraktalorg' }
		]);
		expect(mapLegacyProfile({ profile_id: 1, player_id: 2, user_url: 'www.freestylefrisbee.cz,' }).dropped).toEqual([]);
	});
});

describe('newestPerPlayer', () => {
	it('keeps the row with the highest profile_id for each player', () => {
		const rows = [
			{ profile_id: 3, player_id: '923', nickname: 'old' },
			{ profile_id: 9, player_id: '923', nickname: 'new' },
			{ profile_id: 4, player_id: '1', nickname: 'only' }
		];
		expect(newestPerPlayer(rows).map((row) => row.nickname).sort()).toEqual(['new', 'only']);
	});
});
