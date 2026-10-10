// TournamentStore.swift for the browser: the tournament in play, the saved structures and the settings. Every
// change is written to localStorage straight away, so a running tournament carries on after a reload, and other
// windows (the big screen) follow along through storage events.

import { reactive, ref, shallowRef, watch } from 'vue';
import type { ClockEvent, ClockSnapshot } from './kit/clock';
import { type PrizePool, resetCounters } from './kit/prizePool';
import { type Structure, decodeStructure } from './kit/structure';
import { Tournament } from './kit/tournament';
import { type Settings, decodeSettings } from './settings';

const keys = { tournament: 'bilby.tournament', structures: 'bilby.structures', settings: 'bilby.settings' };

const nowSeconds = () => Date.now() / 1000;

function load(key: string): unknown {
    try {
        const text = localStorage.getItem(key);
        return text === null ? undefined : JSON.parse(text);
    } catch {
        return undefined;
    }
}

function save(key: string, value: unknown): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Private browsing or a full quota: keep going in memory.
    }
}

function loadLibrary(): Structure[] {
    const raw = load(keys.structures);
    return Array.isArray(raw) ? raw.map(decodeStructure).filter((s): s is Structure => s !== null) : [];
}

export const tournament = shallowRef<Tournament>(Tournament.decode(load(keys.tournament)) ?? Tournament.fresh());
export const library = ref<Structure[]>(loadLibrary());
export const settings = reactive<Settings>(decodeSettings(load(keys.settings)));
/** Advances several times a second; views compute what they show from it. */
export const now = ref(nowSeconds());
/** Whether the clock is running right now (it stops by itself after the last level). */
export const isRunning = ref(false);

let applyingRemoteSettings = false;
watch(settings, () => {
    if (!applyingRemoteSettings) save(keys.settings, settings);
}, { deep: true });

const eventHandlers: ((event: ClockEvent) => void)[] = [];
const changeHandlers: (() => void)[] = [];

/** Called for each clock event as it happens. */
export function onClockEvent(handler: (event: ClockEvent) => void): void {
    eventHandlers.push(handler);
}

/** Called after anything about the tournament changed, including the clock moving to the next round. */
export function onChange(handler: () => void): void {
    changeHandlers.push(handler);
    handler();
}

export function snapshot(at: number = now.value): ClockSnapshot {
    return tournament.value.snapshot(at);
}

// MARK: Clock controls

export const toggle = () => change((t, at) => t.clock.toggle(t.structure, at));
export const next = () => change((t, at) => t.clock.next(t.structure, at));
export const previous = () => change((t, at) => t.clock.previous(t.structure, at));
export const restartRound = () => change((t, at) => t.clock.restartRound(t.structure, at));
export const adjust = (minutes: number) => change((t, at) => t.clock.adjust(minutes * 60, t.structure, at));
export const jump = (index: number) => change((t, at) => t.clock.jump(index, t.structure, at));
export const resetClock = () => change((t) => t.replaceStructure(t.structure));

/** Back to level 1 with all counters at zero; the structure and buy-ins stay. */
export const newTournament = () =>
    change((t) => {
        t.replaceStructure(t.structure);
        t.prizePool = resetCounters(t.prizePool);
    });

// MARK: Players and prize pool

export const updatePrizePool = (body: (p: PrizePool) => PrizePool) =>
    change((t) => {
        t.prizePool = body(t.prizePool);
    });

// MARK: Structures

/** Edits the structure in play; the clock stays on its round. */
export const setStructure = (s: Structure) => change((t, at) => t.setStructure(structuredClone(s), at));

/** Plays a different structure from its first level. */
export const use = (s: Structure) => change((t) => t.replaceStructure(structuredClone(s)));

export function saveToLibrary(s: Structure): void {
    const copy = structuredClone(s);
    const i = library.value.findIndex((x) => x.id === copy.id);
    if (i >= 0) library.value[i] = copy;
    else library.value.push(copy);
    save(keys.structures, library.value);
}

export function removeFromLibrary(s: Structure): void {
    library.value = library.value.filter((x) => x.id !== s.id);
    save(keys.structures, library.value);
}

// MARK: Internals

let lastTick = nowSeconds();
let lastRoundIndex = -1;

function change(body: (t: Tournament, at: number) => void): void {
    const at = nowSeconds();
    tick(at);
    const t = tournament.value.clone();
    body(t, at);
    if (t.equals(tournament.value)) return;
    tournament.value = t;
    lastTick = at;
    save(keys.tournament, t);
    changed(at);
}

function changed(at: number): void {
    const clock = tournament.value.clock.caughtUp(tournament.value.structure, at);
    isRunning.value = clock.isRunning;
    lastRoundIndex = clock.roundIndex;
    for (const handler of changeHandlers) handler();
}

export function tick(at: number = nowSeconds()): void {
    const from = lastTick;
    lastTick = at;
    now.value = at;
    const t = tournament.value;
    const clock = t.clock.caughtUp(t.structure, at);
    if (clock.roundIndex !== lastRoundIndex || clock.isRunning !== isRunning.value) changed(at);
    if (at <= from || eventHandlers.length === 0) return;
    const due = t.clock.upcomingEvents(t.structure, from, settings.warningSeconds).filter((e) => e.at <= at);
    // After sleep, don't replay a pile of old alerts; only the ones that just happened.
    for (const event of due) {
        if (at - event.at < 5) for (const handler of eventHandlers) handler(event);
    }
}

/**
 * Ticks four times a second. The timer runs in a worker where it can, because browsers slow down timers in
 * background tabs, and the sounds should still play on time when the clock isn't the front tab.
 */
export function startTicking(): void {
    changed(nowSeconds());
    try {
        const worker = new Worker(new URL('./ticker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = () => tick();
    } catch {
        window.setInterval(() => tick(), 250);
    }
    // Other windows of Bilby write to the same storage; follow their changes.
    window.addEventListener('storage', (event) => {
        if (event.key === keys.tournament) {
            const t = Tournament.decode(load(keys.tournament));
            if (t && !t.equals(tournament.value)) {
                tournament.value = t;
                lastTick = nowSeconds();
                changed(lastTick);
            }
        } else if (event.key === keys.settings) {
            applyingRemoteSettings = true;
            Object.assign(settings, decodeSettings(load(keys.settings)));
            // The watcher runs after this tick; only then accept local changes again.
            queueMicrotask(() => setTimeout(() => (applyingRemoteSettings = false)));
        } else if (event.key === keys.structures) {
            library.value = loadLibrary();
        }
    });
}
