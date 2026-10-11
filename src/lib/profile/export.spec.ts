import { describe, expect, it } from 'vitest';
import { toExport } from './export.ts';

describe('toExport', () => {
	it('produces the versioned envelope fpa-api consumes', () => {
		const result = toExport(
			[
				{ playerId: 'b', updatedAt: new Date('2026-10-11T10:00:00Z'), fields: { nickname: 'B' } },
				{ playerId: 'a', updatedAt: new Date('2026-10-11T09:00:00Z'), fields: { headline: 'A' } }
			],
			new Date('2026-10-11T12:00:00Z')
		);

		expect(result).toEqual({
			version: 1,
			generatedAt: '2026-10-11T12:00:00.000Z',
			profiles: [
				{ playerId: 'a', updatedAt: '2026-10-11T09:00:00.000Z', fields: { headline: 'A' } },
				{ playerId: 'b', updatedAt: '2026-10-11T10:00:00.000Z', fields: { nickname: 'B' } }
			]
		});
	});

	it('leaves out profiles with nothing public to show', () => {
		const result = toExport([{ playerId: 'a', updatedAt: new Date(), fields: { unknownKey: 'x' } }]);
		expect(result.profiles).toEqual([]);
	});
});
