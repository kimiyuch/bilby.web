// A port of BilbyKit's Generator.swift.
//
// Blinds grow geometrically from about 1/250 of the starting stack, so that by the target duration the big blind
// is roughly 1/25 of all chips in play (heads-up with a dozen big blinds each). A few extra levels follow in case
// the game runs long. Every blind is a round number and a multiple of the smallest chip still in play; that chip
// is colored up at a break once it is no longer needed.

import { type AnteStyle, type Round, type Structure, level, pause, structure } from './structure';

export interface GeneratorOptions {
    name: string;
    startingStack: number;
    players: number;
    targetMinutes: number;
    levelMinutes: number;
    /** Chip denominations, any order. */
    chips: number[];
    breakEveryMinutes: number;
    breakMinutes: number;
    /** Null for no antes. */
    anteStyle: AnteStyle | null;
    extraLevels: number;
}

export const defaultGeneratorOptions: GeneratorOptions = {
    name: 'Custom',
    startingStack: 10_000,
    players: 9,
    targetMinutes: 240,
    levelMinutes: 20,
    chips: [25, 100, 500, 1000, 5000],
    breakEveryMinutes: 120,
    breakMinutes: 10,
    anteStyle: 'bigBlind',
    extraLevels: 4,
};

export function generateStructure(options: Partial<GeneratorOptions> = {}): Structure {
    const o = { ...defaultGeneratorOptions, ...options };
    const chips = [...new Set(o.chips.filter((c) => c > 0))].sort((a, b) => a - b);
    const denominations = chips.length === 0 ? [25] : chips;
    const levelMinutes = Math.max(1, o.levelMinutes);
    const breakEvery = o.breakEveryMinutes > 0 && o.breakMinutes > 0 ? o.breakEveryMinutes : Infinity;
    const stack = Math.max(1, o.startingStack);
    const totalChips = stack * Math.max(2, o.players);

    // Count the levels that fit into the target, breaks included.
    let levelsInTarget = 0;
    let time = 0;
    let sinceBreak = 0;
    while (time < o.targetMinutes || levelsInTarget < 3) {
        levelsInTarget += 1;
        time += levelMinutes;
        sinceBreak += levelMinutes;
        if (sinceBreak >= breakEvery && time < o.targetMinutes) {
            time += o.breakMinutes;
            sinceBreak = 0;
        }
    }

    const startTarget = stack / 250;
    const finalTarget = totalChips / 25;
    const ratio = Math.min(2, Math.max(1.15, Math.pow(Math.max(finalTarget / startTarget, 1), 1 / Math.max(1, levelsInTarget - 1))));
    const anteFrom = Math.floor(levelsInTarget / 3) + 1;

    const rounds: Round[] = [];
    let smallestChip = 0; // index into denominations
    let previousBB = 0;
    sinceBreak = 0;
    const levels = levelsInTarget + Math.max(0, o.extraLevels);
    for (let n = 1; n <= levels; n++) {
        const target = startTarget * Math.pow(ratio, n - 1);

        if (sinceBreak >= breakEvery) {
            // Retire chips that are now tiny next to the blinds: a chip goes once the big blind is 20 of it
            // and 5 of the next one.
            const retired: number[] = [];
            while (smallestChip + 1 < denominations.length
                && Math.max(denominations[smallestChip] * 20, denominations[smallestChip + 1] * 5) <= target) {
                retired.push(denominations[smallestChip]);
                smallestChip += 1;
            }
            rounds.push(pause(o.breakMinutes, colorUpNote(retired)));
            sinceBreak = 0;
        }

        const chip = denominations[smallestChip];
        const bb = niceBlind(target, previousBB, chip * 2);
        previousBB = bb;
        let ante = 0;
        if (o.anteStyle && n >= anteFrom) {
            ante = o.anteStyle === 'bigBlind' ? bb : Math.max(chip, Math.round(bb / 8 / chip) * chip);
        }
        rounds.push(level(bb / 2, bb, levelMinutes, ante, o.anteStyle ?? 'bigBlind'));
        sinceBreak += levelMinutes;
    }
    return structure(o.name, rounds);
}

/** Round amounts a dealer would expect: 1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6 or 8 times a power of ten. */
export const mantissas = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8];

/** The round amount closest to `target` that is above `previous` and a multiple of `unit`. */
export function niceBlind(target: number, previous: number, unit: number): number {
    const candidates: number[] = [];
    let power = 1;
    while (candidates.length < 4 || candidates[candidates.length - 1] < target * 2) {
        for (const m of mantissas) {
            // Rounded to cancel floating point noise such as 1.2 × 1000 = 1199.9999999999998.
            const value = Math.round(m * power * 1e6) / 1e6;
            if (!Number.isInteger(value)) continue;
            if (value > previous && value % unit === 0) candidates.push(value);
        }
        power *= 10;
        if (power > 1e15) break;
    }
    if (candidates.length === 0) return Math.max(previous + unit, unit);
    const distance = (v: number) => Math.abs(Math.log(v / target));
    return candidates.reduce((best, v) => (distance(v) < distance(best) ? v : best));
}

export function colorUpNote(chips: number[]): string {
    if (chips.length === 0) return '';
    const names = chips.map((c) => `${c}s`);
    const list = names.length === 1 ? names[0] : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
    return `Color up the ${list}`;
}
