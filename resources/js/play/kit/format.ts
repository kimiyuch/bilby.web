// TimeFormat.swift and Announcement.swift, plus the number and money formatting the clock screen uses.

import { type Round, type Structure, isBreak, levelNumber } from './structure';

function clock(total: number): string {
    const h = Math.floor(total / 3600);
    const m = Math.floor(total / 60) % 60;
    const s = total % 60;
    const ss = s < 10 ? `0${s}` : `${s}`;
    if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${ss}`;
    return `${m}:${ss}`;
}

export const TimeFormat = {
    /** "9:59", "12:00" or "1:05:00". Rounds up, so a fresh 10 minute level reads 10:00 and the last second 0:01. */
    countdown: (seconds: number): string => clock(Math.ceil(Math.max(0, seconds))),

    /** Elapsed time, rounded down: "0:00", "59:59", "2:14:05". */
    elapsed: (seconds: number): string => clock(Math.floor(Math.max(0, seconds))),

    /** "1 h 5 min", "45 min". */
    duration(minutes: number): string {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h === 0) return `${m} min`;
        if (m === 0) return `${h} h`;
        return `${h} h ${m} min`;
    },
};

/** What the clock says out loud. Numbers stay plain digits, which speech synthesizers read well. */
export const Announcement = {
    roundStarted(index: number, s: Structure): string {
        const round = s.rounds[index];
        if (!round) return '';
        if (isBreak(round)) {
            let text = `Break. ${spokenMinutes(round.minutes)}.`;
            if (round.note.trim()) text += ' ' + sentence(round.note);
            return text;
        }
        return `Level ${levelNumber(s, index) ?? 0}. ${Announcement.blinds(round)}.`;
    },

    blinds(round: Round): string {
        let text = `Blinds ${round.smallBlind}, ${round.bigBlind}`;
        if (round.ante > 0) text += `, ante ${round.ante}`;
        return text;
    },

    warning(round: Round, remaining: number): string {
        const seconds = Math.round(remaining);
        const left = seconds < 60 ? `${seconds} seconds` : spokenMinutes(Math.round(remaining / 60));
        return isBreak(round) ? `${left} left in the break.` : `${left} left in this level.`;
    },

    finished: 'That was the last level.',
};

function spokenMinutes(n: number): string {
    return n === 1 ? 'One minute' : `${n} minutes`;
}

function sentence(text: string): string {
    const trimmed = text.trim();
    if (!trimmed) return '';
    return '.!?'.includes(trimmed[trimmed.length - 1]) ? trimmed : trimmed + '.';
}

// MARK: Numbers and money

const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

/** Chip amounts with the locale's grouping, e.g. 1’500. */
export const chips = (n: number): string => numberFormat.format(n);

export const blindsText = (r: Round): string => `${chips(r.smallBlind)} / ${chips(r.bigBlind)}`;

const compactNumber = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

/** Short chip amounts for tight spaces: 800, 1k, 1.5k, 11.1k, 100k, 1.2M. Rounds down, so 1,999 reads 1.9k. */
export function compactChips(n: number): string {
    const short = (value: number, suffix: string) => compactNumber.format(Math.floor(value * 10) / 10) + suffix;
    if (Math.abs(n) >= 1_000_000) return short(n / 1_000_000, 'M');
    if (Math.abs(n) >= 1_000) return short(n / 1_000, 'k');
    return compactNumber.format(n);
}

/** "200 / 400 · 400" with short amounts: "1k / 2k · 2k". */
export const compactText = (r: Round): string => {
    const blinds = `${compactChips(r.smallBlind)} / ${compactChips(r.bigBlind)}`;
    return r.ante > 0 ? `${blinds} · ${compactChips(r.ante)}` : blinds;
};

export const anteText = (r: Round): string | null => {
    if (r.ante <= 0) return null;
    return r.anteStyle === 'bigBlind' ? `Big blind ante ${chips(r.ante)}` : `Ante ${chips(r.ante)}`;
};

/** "200 / 400 · 400", for one-line summaries. */
export const shortText = (r: Round): string => (r.ante > 0 ? `${blindsText(r)} · ${chips(r.ante)}` : blindsText(r));

const moneyFormats = new Map<string, Intl.NumberFormat>();

/** "CHF 260" or "CHF 12.50". */
export function money(amount: number, currency: string): string {
    let format = moneyFormats.get(currency);
    if (!format) {
        try {
            format = new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 2 });
        } catch {
            format = new Intl.NumberFormat(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
        }
        moneyFormats.set(currency, format);
    }
    // Whole amounts without decimals, others with two: 12.5 reads 12.50.
    if (!Number.isInteger(amount)) {
        return format.formatToParts(amount).map((p) => (p.type === 'fraction' && p.value.length === 1 ? p.value + '0' : p.value)).join('');
    }
    return format.format(amount);
}

/** "1st", "2nd", "3rd", in English like the rest of the app. */
export function place(n: number): string {
    const rules = new Intl.PluralRules('en', { type: 'ordinal' });
    const suffix = { one: 'st', two: 'nd', few: 'rd', other: 'th' } as Record<string, string>;
    return `${n}${suffix[rules.select(n)] ?? 'th'}`;
}
