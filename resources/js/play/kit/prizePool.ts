// A port of BilbyKit's PrizePool.swift: buy-ins, the counters kept during the game, and what they add up to.
// Swift uses Decimal for money; here amounts are worked out in cents so they add up exactly.

export interface PrizePool {
    /** ISO currency code, e.g. "CHF". */
    currency: string;
    buyIn: number;
    rebuy: number;
    addOn: number;
    /** Charged with each entry on top of the buy-in; it doesn't go into the prize pool. */
    fee: number;
    startingStack: number;
    rebuyStack: number;
    addOnStack: number;
    entries: number;
    rebuys: number;
    addOns: number;
    playersLeft: number;
    /** Percentages per place for this tournament; null follows the payout table for the number of entries. */
    customPayouts: number[] | null;
}

export function newPrizePool(overrides: Partial<PrizePool> = {}): PrizePool {
    return {
        currency: localCurrency(),
        buyIn: 20,
        rebuy: 20,
        addOn: 20,
        fee: 0,
        startingStack: 10_000,
        rebuyStack: 10_000,
        addOnStack: 10_000,
        entries: 0,
        rebuys: 0,
        addOns: 0,
        playersLeft: 0,
        customPayouts: null,
        ...overrides,
    };
}

/** Reads a saved prize pool, filling in anything missing from the defaults. */
export function decodePrizePool(raw: any): PrizePool {
    const d = newPrizePool();
    if (!raw || typeof raw !== 'object') return d;
    const num = (key: keyof PrizePool) => (typeof raw[key] === 'number' && Number.isFinite(raw[key]) ? raw[key] : d[key]);
    return {
        currency: typeof raw.currency === 'string' ? raw.currency : d.currency,
        buyIn: num('buyIn'),
        rebuy: num('rebuy'),
        addOn: num('addOn'),
        fee: num('fee'),
        startingStack: num('startingStack'),
        rebuyStack: num('rebuyStack'),
        addOnStack: num('addOnStack'),
        entries: num('entries'),
        rebuys: num('rebuys'),
        addOns: num('addOns'),
        playersLeft: num('playersLeft'),
        customPayouts: Array.isArray(raw.customPayouts) && raw.customPayouts.every((n: unknown) => typeof n === 'number')
            ? raw.customPayouts : null,
    } as PrizePool;
}

// MARK: Currency

const byRegion: Record<string, string> = {
    CH: 'CHF', LI: 'CHF', US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', NZ: 'NZD', JP: 'JPY', SE: 'SEK', NO: 'NOK',
    DK: 'DKK', PL: 'PLN', CZ: 'CZK', HU: 'HUF', IN: 'INR', BR: 'BRL', MX: 'MXN', ZA: 'ZAR', SG: 'SGD', HK: 'HKD',
    IE: 'EUR', DE: 'EUR', AT: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', PT: 'EUR', NL: 'EUR', BE: 'EUR', LU: 'EUR',
    FI: 'EUR', GR: 'EUR', SK: 'EUR', SI: 'EUR', EE: 'EUR', LV: 'EUR', LT: 'EUR', MT: 'EUR', CY: 'EUR', HR: 'EUR',
};

const byZone: Record<string, string> = {
    'Europe/Zurich': 'CHF', 'Europe/Vaduz': 'CHF', 'Europe/London': 'GBP', 'Europe/Stockholm': 'SEK',
    'Europe/Oslo': 'NOK', 'Europe/Copenhagen': 'DKK', 'Asia/Tokyo': 'JPY', 'America/Toronto': 'CAD',
    'America/Vancouver': 'CAD', 'Pacific/Auckland': 'NZD',
};

/** The currency of the browser's region; without a region, guess from the time zone like the apps do. */
export function localCurrency(): string {
    const language = typeof navigator === 'undefined' ? '' : navigator.language;
    return currencyFor(language, Intl.DateTimeFormat().resolvedOptions().timeZone ?? '');
}

export function currencyFor(language: string, zone: string): string {
    let region: string | undefined;
    try {
        region = new Intl.Locale(language).maximize().region;
    } catch {
        region = undefined;
    }
    // A bare language like "en" maximizes to its most likely region (US), which says little; use the time zone.
    const explicit = /[-_]([A-Za-z]{2}|\d{3})$/.test(language);
    if (explicit && region && byRegion[region]) return byRegion[region];
    if (byZone[zone]) return byZone[zone];
    if (zone.startsWith('Europe/')) return 'EUR';
    if (zone.startsWith('Australia/')) return 'AUD';
    return 'USD';
}

// MARK: Counters, as pure updates

export const addEntry = (p: PrizePool): PrizePool => ({ ...p, entries: p.entries + 1, playersLeft: p.playersLeft + 1 });

export const removeEntry = (p: PrizePool): PrizePool => {
    if (p.entries <= 0) return p;
    const entries = p.entries - 1;
    return { ...p, entries, playersLeft: Math.min(p.playersLeft, entries) };
};

export const addRebuy = (p: PrizePool): PrizePool => ({ ...p, rebuys: p.rebuys + 1 });
export const removeRebuy = (p: PrizePool): PrizePool => ({ ...p, rebuys: Math.max(0, p.rebuys - 1) });
export const addAddOn = (p: PrizePool): PrizePool => ({ ...p, addOns: p.addOns + 1 });
export const removeAddOn = (p: PrizePool): PrizePool => ({ ...p, addOns: Math.max(0, p.addOns - 1) });
/** A player is knocked out. */
export const eliminate = (p: PrizePool): PrizePool => ({ ...p, playersLeft: Math.max(0, p.playersLeft - 1) });
/** Undo a knockout. */
export const reinstate = (p: PrizePool): PrizePool => ({ ...p, playersLeft: Math.min(p.entries, p.playersLeft + 1) });
export const resetCounters = (p: PrizePool): PrizePool => ({ ...p, entries: 0, rebuys: 0, addOns: 0, playersLeft: 0 });

// MARK: Totals

const cents = (amount: number): number => Math.round(amount * 100);

export const total = (p: PrizePool): number =>
    (p.entries * cents(p.buyIn) + p.rebuys * cents(p.rebuy) + p.addOns * cents(p.addOn)) / 100;

export const fees = (p: PrizePool): number => (p.entries * cents(p.fee)) / 100;

export const chipsInPlay = (p: PrizePool): number =>
    p.entries * p.startingStack + p.rebuys * p.rebuyStack + p.addOns * p.addOnStack;

export const averageStack = (p: PrizePool): number | null =>
    p.playersLeft > 0 ? Math.floor(chipsInPlay(p) / p.playersLeft) : null;

// MARK: Payouts

/** How the prize pool is split, by number of entries. Each row adds up to 100. */
export const payoutTable: { upTo: number; percentages: number[] }[] = [
    { upTo: 5, percentages: [100] },
    { upTo: 10, percentages: [65, 35] },
    { upTo: 17, percentages: [50, 30, 20] },
    { upTo: 27, percentages: [45, 27, 17, 11] },
    { upTo: 36, percentages: [40, 25, 15, 11, 9] },
    { upTo: 50, percentages: [37, 23, 15, 10, 8, 7] },
    { upTo: 75, percentages: [34, 21, 14, 10, 8, 7, 6] },
    { upTo: 100, percentages: [31, 19, 13, 10, 8, 7, 6, 6] },
    { upTo: Infinity, percentages: [28, 17, 12, 9, 8, 7, 6, 5, 4, 4] },
];

export const tablePercentages = (entries: number): number[] =>
    payoutTable.find((row) => entries <= row.upTo)!.percentages;

export const payoutPercentages = (p: PrizePool): number[] => p.customPayouts ?? tablePercentages(p.entries);

/** Small pools pay whole amounts, bigger ones round to 5 or 10. */
export function roundingUnit(amount: number): number {
    if (amount < 500) return 1;
    if (amount < 5000) return 5;
    return 10;
}

/**
 * Prize money per place. Every place but first is rounded down to `unit`; first place gets the rest,
 * so the payouts always add up to the whole pool.
 */
export function payouts(p: PrizePool, unit?: number): number[] {
    const percentages = payoutPercentages(p).map((x) => Math.max(0, x));
    const sum = percentages.reduce((a, b) => a + b, 0);
    const pool = total(p);
    if (sum <= 0 || pool <= 0) return percentages.map(() => 0);
    const unitCents = cents(unit ?? roundingUnit(pool));
    const poolCents = cents(pool);
    const amounts = percentages.map((pct) => {
        const share = (poolCents * pct) / sum;
        // A little slack so 78.00000000001 cents of noise doesn't lose a unit.
        return unitCents > 0 ? Math.floor(share / unitCents + 1e-9) * unitCents : share;
    });
    amounts[0] = poolCents - amounts.slice(1).reduce((a, b) => a + b, 0);
    return amounts.map((c) => c / 100);
}
