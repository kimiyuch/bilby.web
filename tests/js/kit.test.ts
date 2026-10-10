// Ported from BilbyKit/Tests/BilbyKitTests: GeneratorTests, PrizePoolTests and StructureTests.

import { describe, expect, test } from 'vitest';
import { Announcement, TimeFormat, compactChips, compactText, place } from '../../resources/js/play/kit/format';
import {
    type GeneratorOptions, colorUpNote, defaultGeneratorOptions, generateStructure, mantissas, niceBlind,
} from '../../resources/js/play/kit/generator';
import { allPresets, standard, turbo } from '../../resources/js/play/kit/presets';
import {
    type PrizePool, addAddOn, addEntry, addRebuy, averageStack, chipsInPlay, currencyFor, decodePrizePool, eliminate, fees,
    newPrizePool, payoutTable, payouts, reinstate, removeEntry, removeRebuy, tablePercentages, total,
} from '../../resources/js/play/kit/prizePool';
import {
    StructureFileError, exportStructure, importStructure, isBreak, level, levelCount, levelNumber, suggestedLevel, totalDuration,
} from '../../resources/js/play/kit/structure';

describe('Generator', () => {
    const shapes: Partial<GeneratorOptions>[] = [
        {},
        { startingStack: 10_000, players: 6, targetMinutes: 120, levelMinutes: 10 },
        { startingStack: 25_000, players: 20, targetMinutes: 360, levelMinutes: 30, chips: [25, 100, 500, 1000, 5000] },
        { startingStack: 1500, players: 8, targetMinutes: 180, levelMinutes: 15, chips: [5, 25, 100, 500] },
        { startingStack: 200, players: 4, targetMinutes: 90, levelMinutes: 15, chips: [1, 5, 25], anteStyle: 'everyone' },
        { startingStack: 50_000, players: 40, targetMinutes: 480, levelMinutes: 40, chips: [100, 500, 1000, 5000, 25000] },
    ];

    const mantissa = (value: number) => {
        let v = value;
        while (v >= 10) v /= 10;
        return Math.round(v * 10) / 10;
    };

    test.each(shapes)('blinds are round and playable with the chips in play (%o)', (partial) => {
        const options = { ...defaultGeneratorOptions, ...partial };
        const structure = generateStructure(options);
        const chips = [...options.chips].sort((a, b) => a - b);
        let smallest = chips[0];
        let previousBB = 0;
        for (const round of structure.rounds) {
            if (isBreak(round)) {
                // A color-up removes the smallest chips.
                const match = round.note.match(/^Color up the (.*)$/);
                if (match) {
                    const retired = match[1].replace(' and ', ', ').split(', ').map((n) => parseInt(n, 10));
                    expect(retired[0]).toBe(smallest);
                    smallest = chips.find((c) => c > Math.max(...retired))!;
                }
                continue;
            }
            expect(round.minutes).toBe(options.levelMinutes);
            expect(round.bigBlind).toBeGreaterThan(previousBB);
            expect(round.smallBlind * 2).toBe(round.bigBlind);
            expect(round.smallBlind % smallest).toBe(0);
            expect(round.ante % smallest).toBe(0);
            expect(mantissas).toContain(mantissa(round.bigBlind));
            previousBB = round.bigBlind;
        }
    });

    test.each(shapes)('fits the target duration (%o)', (partial) => {
        const options = { ...defaultGeneratorOptions, ...partial };
        const structure = generateStructure(options);
        const minutes = totalDuration(structure) / 60;
        const extra = options.extraLevels * options.levelMinutes;
        // The levels within the target, plus the extra levels and maybe their breaks.
        expect(minutes).toBeGreaterThanOrEqual(options.targetMinutes + extra);
        expect(minutes).toBeLessThanOrEqual(options.targetMinutes + extra + options.levelMinutes + 2 * options.breakMinutes);

        const levels = structure.rounds.filter((r) => !isBreak(r));
        const totalChips = options.startingStack * options.players;
        const levelAtTarget = levels[levels.length - options.extraLevels - 1];
        // At the target time, the big blind is a sizable part of all chips: the game is nearly over.
        expect(levelAtTarget.bigBlind).toBeGreaterThan(totalChips / 50);
        expect(levelAtTarget.bigBlind).toBeLessThan(totalChips / 12);
        // A starting stack is deep: at least 100 big blinds.
        expect(Math.floor(options.startingStack / levels[0].bigBlind)).toBeGreaterThanOrEqual(100);
    });

    test('breaks and antes', () => {
        const s = generateStructure();
        const breakIndices = s.rounds.flatMap((r, i) => (isBreak(r) ? [i] : []));
        expect(breakIndices.length).toBeGreaterThanOrEqual(2);
        // 120 minutes of play between breaks: six 20-minute levels.
        expect(breakIndices[0]).toBe(6);
        expect(s.rounds.some((r) => r.note.startsWith('Color up the 25s'))).toBe(true);
        expect(s.rounds[0].ante).toBe(0);
        const last = s.rounds[s.rounds.length - 1];
        expect(last.ante).toBe(last.bigBlind);

        expect(generateStructure({ anteStyle: null }).rounds.every((r) => r.ante === 0)).toBe(true);
        expect(generateStructure({ breakEveryMinutes: 0 }).rounds.some(isBreak)).toBe(false);
    });

    test('nice blinds', () => {
        expect(niceBlind(40, 0, 50)).toBe(50);
        expect(niceBlind(140, 100, 50)).toBe(150);
        expect(niceBlind(100, 100, 50)).toBe(150);
        expect(niceBlind(2300, 2000, 50)).toBe(2500);
        expect(niceBlind(2600, 2000, 200)).toBe(3000);
        expect(colorUpNote([25, 100])).toBe('Color up the 25s and 100s');
        expect(colorUpNote([])).toBe('');
    });
});

describe('PrizePool', () => {
    const pool = (entries: number, rebuys = 0, addOns = 0): PrizePool => {
        let p = newPrizePool({ currency: 'CHF', buyIn: 20, rebuy: 20, addOn: 10, fee: 2, startingStack: 10_000, rebuyStack: 10_000, addOnStack: 5_000 });
        for (let i = 0; i < entries; i++) p = addEntry(p);
        for (let i = 0; i < rebuys; i++) p = addRebuy(p);
        for (let i = 0; i < addOns; i++) p = addAddOn(p);
        return p;
    };

    test('totals', () => {
        let p = pool(9, 3, 5);
        expect(total(p)).toBe(290);
        expect(fees(p)).toBe(18);
        expect(chipsInPlay(p)).toBe(9 * 10_000 + 3 * 10_000 + 5 * 5_000);
        expect(p.playersLeft).toBe(9);
        p = eliminate(eliminate(p));
        expect(p.playersLeft).toBe(7);
        expect(averageStack(p)).toBe(Math.floor(145_000 / 7));
    });

    test('counter limits', () => {
        let p = reinstate(pool(2));
        expect(p.playersLeft).toBe(2);
        for (let i = 0; i < 5; i++) p = eliminate(p);
        expect(p.playersLeft).toBe(0);
        expect(averageStack(p)).toBeNull();
        p = removeEntry(removeEntry(removeEntry(reinstate(p))));
        expect([p.entries, p.playersLeft]).toEqual([0, 0]);
        expect(removeRebuy(p).rebuys).toBe(0);
    });

    test('table rows add up to a hundred', () => {
        for (const row of payoutTable) {
            expect(row.percentages.reduce((a, b) => a + b, 0)).toBe(100);
            expect(row.percentages).toEqual([...row.percentages].sort((a, b) => b - a));
        }
        expect(tablePercentages(0)).toEqual([100]);
        expect(tablePercentages(10)).toHaveLength(2);
        expect(tablePercentages(11)).toHaveLength(3);
        expect(tablePercentages(500)).toHaveLength(10);
    });

    test('payouts add up to the pool', () => {
        for (const entries of [1, 6, 9, 13, 20, 33, 47, 80, 150]) {
            const p = pool(entries, Math.floor(entries / 3));
            const amounts = payouts(p);
            expect(amounts.reduce((a, b) => a + b, 0)).toBe(total(p));
            expect(amounts).toEqual([...amounts].sort((a, b) => b - a));
        }
    });

    test('payouts round to the unit', () => {
        // 13 entries × 20 = 260: 50/30/20 → 130/78/52.
        expect(payouts(pool(13))).toEqual([130, 78, 52]);
        expect(payouts(pool(13), 5)).toEqual([135, 75, 50]);
        // 47 entries × 20 = 940, rounded to 5 below first place.
        expect(payouts(pool(47)).slice(1).every((a) => a % 5 === 0)).toBe(true);
    });

    test('payouts with cents', () => {
        const p = { ...pool(3), buyIn: 12.5 };
        expect(total(p)).toBe(37.5);
        expect(payouts({ ...p, customPayouts: [60, 40] })).toEqual([22.5, 15]);
    });

    test('custom payouts', () => {
        const p = pool(10);
        expect(payouts({ ...p, customPayouts: [60, 30, 10] })).toEqual([120, 60, 20]);
        // Percentages that don't add up to 100 are scaled.
        expect(payouts({ ...p, customPayouts: [2, 1, 1] })).toEqual([100, 50, 50]);
        expect(payouts(pool(0))).toEqual([0]);
    });

    test('currency from the language or time zone', () => {
        expect(currencyFor('de-CH', 'Europe/Zurich')).toBe('CHF');
        expect(currencyFor('en-US', 'Europe/Zurich')).toBe('USD');
        expect(currencyFor('en', 'Europe/Zurich')).toBe('CHF');
        expect(currencyFor('en', 'Europe/Paris')).toBe('EUR');
        expect(currencyFor('en-001', 'Europe/Paris')).toBe('EUR');
    });

    test('decodes older or partial data', () => {
        const p = decodePrizePool({ currency: 'EUR', entries: 4 });
        expect([p.currency, p.entries, p.buyIn]).toEqual(['EUR', 4, 20]);
    });
});

describe('Structure', () => {
    test('level numbers skip breaks', () => {
        const s = standard();
        expect(levelNumber(s, 0)).toBe(1);
        expect(levelNumber(s, 4)).toBeNull();
        expect(levelNumber(s, 5)).toBe(5);
        expect(levelCount(s)).toBe(18);
    });

    test('export and import round trip', () => {
        const original = turbo();
        const text = exportStructure(original);
        expect(text).toContain('"format": "bilby.structure"');
        expect(text).toContain('Color up the 25s');

        const imported = importStructure(text);
        expect(imported.name).toBe(original.name);
        expect(imported.id).not.toBe(original.id);
        expect(imported.rounds).toHaveLength(original.rounds.length);
        imported.rounds.forEach((a, i) => {
            const b = original.rounds[i];
            expect(a.id).not.toBe(b.id);
            expect([a.type, a.minutes, a.bigBlind, a.ante, a.note]).toEqual([b.type, b.minutes, b.bigBlind, b.ante, b.note]);
        });
    });

    test('imports files written by the apps', () => {
        // As written by Structure.exportData() in Swift: sorted keys, uppercase UUIDs.
        const swift = `{
  "format" : "bilby.structure",
  "name" : "Quick",
  "rounds" : [
    { "bigBlind" : 100, "id" : "0F8E3B39-5E0B-4C55-9C1E-0B8B9B9C1D1A", "minutes" : 15, "smallBlind" : 50, "type" : "level" },
    { "id" : "5B0C2E2E-4C1A-4E57-8F3F-1A2B3C4D5E6F", "minutes" : 5, "note" : "Color up", "type" : "break" }
  ],
  "version" : 1
}`;
        const s = importStructure(swift);
        expect(s.rounds.map((r) => r.type)).toEqual(['level', 'break']);
        expect(s.rounds[1].note).toBe('Color up');
    });

    test('imports hand-written files', () => {
        const json = `{"format": "bilby.structure", "version": 1, "name": "Quick",
         "rounds": [{"type": "level", "minutes": 15, "smallBlind": 50, "bigBlind": 100},
                    {"type": "break", "minutes": 5},
                    {"type": "level", "minutes": 15, "smallBlind": 100, "bigBlind": 200, "ante": 25, "anteStyle": "everyone"}]}`;
        const s = importStructure(json);
        expect(s.rounds).toHaveLength(3);
        expect(isBreak(s.rounds[1])).toBe(true);
        expect(s.rounds[2].anteStyle).toBe('everyone');
        expect(s.rounds[2].ante).toBe(25);
    });

    test('rejects bad files', () => {
        const error = (text: string) => {
            try {
                importStructure(text);
            } catch (e) {
                return (e as StructureFileError).error;
            }
            return null;
        };
        expect(error('{}')).toEqual({ kind: 'notAStructure' });
        expect(error('not json')).toEqual({ kind: 'notAStructure' });
        expect(error('{"format":"other","version":1,"name":"x","rounds":[]}')).toEqual({ kind: 'notAStructure' });
        expect(error('{"format":"bilby.structure","version":9,"name":"x","rounds":[]}')).toEqual({ kind: 'unsupportedVersion', version: 9 });
        expect(error('{"format":"bilby.structure","version":1,"name":"x","rounds":[]}')).toEqual({ kind: 'empty' });
        expect(error('{"format":"bilby.structure","version":1,"name":"x","rounds":[{"type":"level","minutes":10,"smallBlind":200,"bigBlind":100}]}'))
            .toEqual({ kind: 'invalidLevel', index: 1 });
    });

    test.each(allPresets().map((p) => [p.name, p]))('preset %s is sensible', (_, preset) => {
        const levels = preset.rounds.filter((r) => !isBreak(r));
        expect(levels[0].smallBlind).toBe(25);
        for (let i = 1; i < levels.length; i++) expect(levels[i].bigBlind).toBeGreaterThanOrEqual(levels[i - 1].bigBlind);
        for (const l of levels) {
            expect(l.smallBlind * 2).toBe(l.bigBlind);
            expect(l.ante === 0 || l.ante === l.bigBlind).toBe(true);
        }
    });

    test('announcements', () => {
        const s = standard();
        expect(Announcement.roundStarted(0, s)).toBe('Level 1. Blinds 25, 50.');
        expect(Announcement.roundStarted(7, s)).toBe('Level 7. Blinds 200, 400, ante 400.');
        expect(Announcement.roundStarted(9, s)).toBe('Break. 15 minutes. Color up the 25s.');
        expect(Announcement.roundStarted(4, s)).toBe('Break. 10 minutes.');
        expect(Announcement.warning(s.rounds[0], 60)).toBe('One minute left in this level.');
        expect(Announcement.warning(s.rounds[4], 120)).toBe('2 minutes left in the break.');
        expect(Announcement.warning(s.rounds[0], 30)).toBe('30 seconds left in this level.');
    });

    test('suggested level follows the previous one', () => {
        const s = standard();
        const after = suggestedLevel(s, level(400, 800, 20, 800));
        expect([after.bigBlind, after.smallBlind, after.ante, after.minutes]).toEqual([1200, 600, 1200, 20]);
        const everyone = suggestedLevel(s, level(100, 200, 15, 25, 'everyone'));
        expect([everyone.bigBlind, everyone.ante, everyone.anteStyle]).toEqual([300, 50, 'everyone']);
        expect(suggestedLevel(s, null).bigBlind).toBe(50);
    });
});

describe('TimeFormat', () => {
    test('formats', () => {
        expect(TimeFormat.countdown(600)).toBe('10:00');
        expect(TimeFormat.countdown(599.2)).toBe('10:00');
        expect(TimeFormat.countdown(0.3)).toBe('0:01');
        expect(TimeFormat.countdown(0)).toBe('0:00');
        expect(TimeFormat.countdown(3900)).toBe('1:05:00');
        expect(TimeFormat.elapsed(8045.9)).toBe('2:14:05');
        expect(TimeFormat.duration(65)).toBe('1 h 5 min');
        expect(TimeFormat.duration(120)).toBe('2 h');
        expect(TimeFormat.duration(45)).toBe('45 min');
        expect([800, 1000, 1500, 1999, 11_111, 100_000, 1_200_000].map(compactChips))
            .toEqual(['800', '1k', '1.5k', '1.9k', '11.1k', '100k', '1.2M']);
        expect(compactText(level(500, 1000, 20, 1000))).toBe('500 / 1k · 1k');
        expect(compactText(level(25, 50, 20))).toBe('25 / 50');
        expect([1, 2, 3, 4, 11, 12, 13, 21, 22].map(place)).toEqual(['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd']);
    });
});
