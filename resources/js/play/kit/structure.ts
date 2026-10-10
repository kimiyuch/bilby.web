// A port of BilbyKit's Structure.swift. Rounds and structures are plain objects, so they can go straight into
// localStorage and into exported files.

import { niceBlind } from './generator';

/** How the ante of a level is paid: by every player, or by the big blind for the whole table. */
export type AnteStyle = 'everyone' | 'bigBlind';

/** One step of a blind structure: a level with blinds, or a break. */
export interface Round {
    id: string;
    type: 'level' | 'break';
    minutes: number;
    smallBlind: number;
    bigBlind: number;
    ante: number;
    anteStyle: AnteStyle;
    /** Shown during a break, e.g. "Color up the 25s". */
    note: string;
}

/** A named list of levels and breaks. */
export interface Structure {
    id: string;
    name: string;
    rounds: Round[];
}

export const newId = (): string =>
    globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export function level(smallBlind: number, bigBlind: number, minutes: number, ante = 0, anteStyle: AnteStyle = 'bigBlind'): Round {
    return { id: newId(), type: 'level', minutes, smallBlind, bigBlind, ante, anteStyle, note: '' };
}

export function pause(minutes: number, note = ''): Round {
    return { id: newId(), type: 'break', minutes, smallBlind: 0, bigBlind: 0, ante: 0, anteStyle: 'bigBlind', note };
}

export function structure(name: string, rounds: Round[]): Structure {
    return { id: newId(), name, rounds };
}

export const isBreak = (round: Round): boolean => round.type === 'break';

/** Seconds. */
export const duration = (round: Round): number => Math.max(round.minutes, 0) * 60;

/** The level number of the round at `index` (breaks don't count), or null for a break. */
export function levelNumber(s: Structure, index: number): number | null {
    const round = s.rounds[index];
    if (!round || isBreak(round)) return null;
    return s.rounds.slice(0, index + 1).filter((r) => !isBreak(r)).length;
}

export const levelCount = (s: Structure): number => s.rounds.filter((r) => !isBreak(r)).length;

/** Seconds. */
export const totalDuration = (s: Structure): number => s.rounds.reduce((sum, r) => sum + duration(r), 0);

/** A sensible level to follow `previous`: blinds up by about half, same length and ante style. */
export function suggestedLevel(s: Structure, previous: Round | null | undefined): Round {
    if (!previous || previous.bigBlind <= 0) return level(25, 50, 20);
    const smallest = s.rounds.find((r) => !isBreak(r) && r.smallBlind > 0)?.smallBlind ?? 1;
    const bb = niceBlind(previous.bigBlind * 1.5, previous.bigBlind, smallest * 2);
    let ante = 0;
    if (previous.ante > 0) {
        const scaled = (previous.ante * bb) / previous.bigBlind / smallest;
        ante = previous.anteStyle === 'bigBlind' ? bb : Math.max(smallest, Math.round(scaled) * smallest);
    }
    return level(bb / 2, bb, previous.minutes, ante, previous.anteStyle);
}

// MARK: Import and export, in the same format as the apps

const fileFormat = 'bilby.structure';
const fileVersion = 1;

export type FileError =
    | { kind: 'notAStructure' }
    | { kind: 'unsupportedVersion'; version: number }
    | { kind: 'empty' }
    | { kind: 'invalidLevel'; index: number };

export class StructureFileError extends Error {
    constructor(public readonly error: FileError) {
        super(error.kind);
    }
}

/** Only writes the fields that matter for the kind, so exported files stay readable. */
function encodeRound(r: Round): Record<string, unknown> {
    const out: Record<string, unknown> = { id: r.id.toUpperCase(), minutes: r.minutes, type: r.type };
    if (r.type === 'level') {
        out.bigBlind = r.bigBlind;
        out.smallBlind = r.smallBlind;
        if (r.ante > 0) {
            out.ante = r.ante;
            out.anteStyle = r.anteStyle;
        }
    } else if (r.note) {
        out.note = r.note;
    }
    return sortKeys(out);
}

function sortKeys(o: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : 1)));
}

/** Pretty-printed JSON, suitable for sharing, and readable by the Mac and iPhone apps. */
export function exportStructure(s: Structure): string {
    const file = sortKeys({ format: fileFormat, name: s.name, rounds: s.rounds.map(encodeRound), version: fileVersion });
    return JSON.stringify(file, null, 2);
}

const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
const optionalInt = (v: unknown): number => {
    if (v === undefined || v === null) return 0;
    if (!isInt(v)) throw new StructureFileError({ kind: 'notAStructure' });
    return v;
};

/** Reads an exported structure. The result gets new IDs, so importing the same file twice gives two structures. */
export function importStructure(text: string): Structure {
    const fail = (error: FileError): never => {
        throw new StructureFileError(error);
    };
    let file: any;
    try {
        file = JSON.parse(text);
    } catch {
        return fail({ kind: 'notAStructure' });
    }
    if (!file || typeof file !== 'object' || typeof file.format !== 'string' || !isInt(file.version)
        || typeof file.name !== 'string' || !Array.isArray(file.rounds)) {
        return fail({ kind: 'notAStructure' });
    }
    if (file.format !== fileFormat) fail({ kind: 'notAStructure' });
    if (file.version > fileVersion) fail({ kind: 'unsupportedVersion', version: file.version });
    if (file.rounds.length === 0) fail({ kind: 'empty' });

    const rounds = file.rounds.map((raw: any, i: number): Round => {
        if (!raw || typeof raw !== 'object' || (raw.type !== 'level' && raw.type !== 'break') || !isInt(raw.minutes)) {
            return fail({ kind: 'notAStructure' });
        }
        const anteStyle = raw.anteStyle ?? 'bigBlind';
        if (anteStyle !== 'bigBlind' && anteStyle !== 'everyone') fail({ kind: 'notAStructure' });
        const round: Round = {
            id: newId(),
            type: raw.type,
            minutes: raw.minutes,
            smallBlind: optionalInt(raw.smallBlind),
            bigBlind: optionalInt(raw.bigBlind),
            ante: optionalInt(raw.ante),
            anteStyle,
            note: typeof raw.note === 'string' ? raw.note : '',
        };
        if (round.minutes <= 0) fail({ kind: 'invalidLevel', index: i + 1 });
        if (!isBreak(round) && (round.bigBlind <= 0 || round.smallBlind < 0 || round.smallBlind > round.bigBlind || round.ante < 0)) {
            fail({ kind: 'invalidLevel', index: i + 1 });
        }
        return round;
    });
    return structure(file.name, rounds);
}

/** Reads a structure back from storage, filling in anything missing. Returns null if it isn't one. */
export function decodeStructure(raw: any): Structure | null {
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.rounds)) return null;
    const rounds: Round[] = raw.rounds
        .filter((r: any) => r && (r.type === 'level' || r.type === 'break'))
        .map((r: any) => ({
            id: typeof r.id === 'string' ? r.id : newId(),
            type: r.type,
            minutes: Number(r.minutes) || 0,
            smallBlind: Number(r.smallBlind) || 0,
            bigBlind: Number(r.bigBlind) || 0,
            ante: Number(r.ante) || 0,
            anteStyle: r.anteStyle === 'everyone' ? 'everyone' : 'bigBlind',
            note: typeof r.note === 'string' ? r.note : '',
        }));
    if (rounds.length === 0) return null;
    return { id: typeof raw.id === 'string' ? raw.id : newId(), name: String(raw.name ?? 'Structure'), rounds };
}

export function structuresEqual(a: Structure, b: Structure): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}
