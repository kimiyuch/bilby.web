// A port of BilbyKit's Clock.swift. All times are in seconds: durations as such, moments as seconds since 1970
// (Date.now() / 1000).

import { type Round, type Structure, duration, isBreak, levelCount, levelNumber, pause } from './structure';

export type ClockMode = { paused: number } | { endsAt: number };

/** What the clock stores; also its saved form. */
export interface ClockState {
    roundIndex: number;
    mode: ClockMode;
    hasStarted: boolean;
    /** The last round ran out. */
    isFinished: boolean;
    /** Running time before the current run. */
    elapsedBefore: number;
    runningSince: number | null;
}

export interface ClockEvent {
    at: number;
    /** warning: the round at `roundIndex` is about to end; roundStarted: it just began; finished: the last one ran out. */
    kind: 'warning' | 'roundStarted' | 'finished';
    roundIndex: number;
}

/**
 * The tournament clock.
 *
 * A running clock only stores the moment its current round ends, never a counter that ticks down, so it is
 * correct after sleep, a reload or time in a background tab. Every read takes `now` and first catches up
 * over any rounds that ended in the meantime.
 */
export class Clock {
    private constructor(private state: ClockState) {}

    static start(s: Structure): Clock {
        return new Clock({
            roundIndex: 0,
            mode: { paused: s.rounds[0] ? duration(s.rounds[0]) : 0 },
            hasStarted: false,
            isFinished: false,
            elapsedBefore: 0,
            runningSince: null,
        });
    }

    static decode(raw: any, s: Structure): Clock {
        const fresh = Clock.start(s);
        if (!raw || typeof raw !== 'object') return fresh;
        const mode = raw.mode;
        const validMode = mode && (typeof mode.paused === 'number' || typeof mode.endsAt === 'number');
        if (!validMode || typeof raw.roundIndex !== 'number') return fresh;
        return new Clock({
            roundIndex: raw.roundIndex,
            mode: typeof mode.endsAt === 'number' ? { endsAt: mode.endsAt } : { paused: mode.paused },
            hasStarted: !!raw.hasStarted,
            isFinished: !!raw.isFinished,
            elapsedBefore: Number(raw.elapsedBefore) || 0,
            runningSince: typeof raw.runningSince === 'number' ? raw.runningSince : null,
        });
    }

    toJSON(): ClockState {
        return { ...this.state, mode: { ...this.state.mode } };
    }

    clone(): Clock {
        return new Clock(this.toJSON());
    }

    equals(other: Clock): boolean {
        return JSON.stringify(this.state) === JSON.stringify(other.state);
    }

    get roundIndex(): number {
        return this.state.roundIndex;
    }

    get hasStarted(): boolean {
        return this.state.hasStarted;
    }

    get isFinished(): boolean {
        return this.state.isFinished;
    }

    get isRunning(): boolean {
        return 'endsAt' in this.state.mode;
    }

    // MARK: Reading

    /** The clock as of `now`, with any rounds that ended in the meantime skipped. */
    caughtUp(s: Structure, now: number): Clock {
        const clock = this.clone();
        clock.catchUp(s, now);
        return clock;
    }

    remaining(now: number): number {
        const mode = this.state.mode;
        return 'endsAt' in mode ? Math.max(0, mode.endsAt - now) : mode.paused;
    }

    /** Time the clock has been running, pauses excluded. */
    elapsed(now: number): number {
        const since = this.state.runningSince;
        return this.state.elapsedBefore + (since === null ? 0 : Math.max(0, now - since));
    }

    /**
     * When the display next changes: the countdown's next second while the clock runs, the next second of the
     * time of day while it's paused. Ticking then keeps every second on screen equally long.
     */
    nextSecond(s: Structure, now: number): number {
        const clock = this.caughtUp(s, now);
        const toward = clock.isRunning ? clock.remaining(now) : -now;
        const left = toward - Math.floor(toward);
        return now + (left === 0 ? 1 : left);
    }

    snapshot(s: Structure, now: number): ClockSnapshot {
        return makeSnapshot(this.caughtUp(s, now), s, now);
    }

    // MARK: Controls

    start(s: Structure, now: number): void {
        this.catchUp(s, now);
        const mode = this.state.mode;
        if (!('paused' in mode) || this.state.isFinished || s.rounds.length === 0) return;
        this.state.mode = { endsAt: now + mode.paused };
        this.state.runningSince = now;
        this.state.hasStarted = true;
        this.catchUp(s, now);
    }

    pause(s: Structure, now: number): void {
        this.catchUp(s, now);
        const mode = this.state.mode;
        if (!('endsAt' in mode)) return;
        this.stopRunning(now);
        this.state.mode = { paused: Math.max(0, mode.endsAt - now) };
    }

    toggle(s: Structure, now: number): void {
        if (this.caughtUp(s, now).isRunning) this.pause(s, now);
        else this.start(s, now);
    }

    next(s: Structure, now: number): void {
        this.catchUp(s, now);
        if (this.state.roundIndex + 1 >= s.rounds.length) return;
        this.jump(this.state.roundIndex + 1, s, now);
    }

    previous(s: Structure, now: number): void {
        this.catchUp(s, now);
        if (this.state.roundIndex <= 0) return;
        this.jump(this.state.roundIndex - 1, s, now);
    }

    /** Starts the round at `index` from the top, keeping the clock running or paused as it was. */
    jump(index: number, s: Structure, now: number): void {
        this.catchUp(s, now);
        if (index < 0 || index >= s.rounds.length) return;
        this.state.roundIndex = index;
        this.state.isFinished = false;
        this.setRemaining(duration(s.rounds[index]), now);
    }

    restartRound(s: Structure, now: number): void {
        this.jump(this.state.roundIndex, s, now);
    }

    /** Adds or removes time from the current round. Taking it below zero ends the round. */
    adjust(seconds: number, s: Structure, now: number): void {
        this.catchUp(s, now);
        if (s.rounds.length === 0) return;
        if (this.state.isFinished) {
            if (seconds <= 0) return;
            this.state.isFinished = false;
        }
        this.setRemaining(Math.max(0, this.remaining(now) + seconds), now);
        this.catchUp(s, now);
    }

    /**
     * Keeps the clock on the same round after the structure was edited: follows the round if it moved,
     * and adds or removes the difference if its duration changed.
     */
    structureChanged(old: Structure, next: Structure, now: number): void {
        this.catchUp(old, now);
        if (next.rounds.length === 0) return;
        const current = old.rounds[this.state.roundIndex];
        const index = current ? next.rounds.findIndex((r) => r.id === current.id) : -1;
        if (current && index >= 0) {
            this.state.roundIndex = index;
            const change = duration(next.rounds[index]) - duration(current);
            if (change !== 0) {
                if (this.state.isFinished && change > 0) this.state.isFinished = false;
                this.setRemaining(Math.max(0, this.remaining(now) + change), now);
            }
        } else {
            // The current round was deleted: carry on with whatever is in its place.
            this.state.roundIndex = Math.min(this.state.roundIndex, next.rounds.length - 1);
            this.state.isFinished = false;
            this.setRemaining(duration(next.rounds[this.state.roundIndex]), now);
        }
        if (!this.state.hasStarted) this.setRemaining(duration(next.rounds[this.state.roundIndex]), now);
        this.catchUp(next, now);
    }

    // MARK: Events

    /** Everything that will happen while the clock keeps running, in order, starting after `now`. */
    upcomingEvents(s: Structure, now: number, warning: number, limit = 200): ClockEvent[] {
        const clock = this.caughtUp(s, now);
        const mode = clock.state.mode;
        if (!('endsAt' in mode)) return [];
        let endsAt = mode.endsAt;
        const events: ClockEvent[] = [];
        let index = clock.state.roundIndex;
        while (events.length < limit) {
            const round = s.rounds[index];
            const warnAt = endsAt - warning;
            if (warning > 0 && warning < duration(round) && warnAt > now) {
                events.push({ at: warnAt, kind: 'warning', roundIndex: index });
            }
            if (index + 1 >= s.rounds.length) {
                events.push({ at: endsAt, kind: 'finished', roundIndex: index });
                break;
            }
            index += 1;
            events.push({ at: endsAt, kind: 'roundStarted', roundIndex: index });
            endsAt += duration(s.rounds[index]);
        }
        return events.slice(0, limit);
    }

    // MARK: Internals

    private setRemaining(remaining: number, now: number): void {
        this.state.mode = 'endsAt' in this.state.mode ? { endsAt: now + remaining } : { paused: remaining };
    }

    private stopRunning(at: number): void {
        if (this.state.runningSince !== null) this.state.elapsedBefore += Math.max(0, at - this.state.runningSince);
        this.state.runningSince = null;
    }

    /** Moves past every round that has ended by `now`. After the last round the clock stops. */
    private catchUp(s: Structure, now: number): void {
        if (s.rounds.length === 0) return;
        if (this.state.roundIndex >= s.rounds.length) this.state.roundIndex = s.rounds.length - 1;
        const mode = this.state.mode;
        if (!('endsAt' in mode)) return;
        let endsAt = mode.endsAt;
        while (endsAt <= now) {
            if (this.state.roundIndex + 1 < s.rounds.length) {
                this.state.roundIndex += 1;
                endsAt += duration(s.rounds[this.state.roundIndex]);
            } else {
                this.stopRunning(endsAt);
                this.state.mode = { paused: 0 };
                this.state.isFinished = true;
                return;
            }
        }
        this.state.mode = { endsAt };
    }
}

/** Everything the clock screen shows, computed for one moment. */
export interface ClockSnapshot {
    roundIndex: number;
    round: Round;
    /** Null during a break. */
    levelNumber: number | null;
    /** How many levels the structure has, breaks not counted. */
    levelCount: number;
    remaining: number;
    endsAt: number | null;
    /** How much of the round has passed, 0 to 1. */
    progress: number;
    isRunning: boolean;
    hasStarted: boolean;
    isFinished: boolean;
    isBreak: boolean;
    /** The round after this one, level or break. */
    nextRound: Round | null;
    /** The next round that is a level. */
    nextLevel: Round | null;
    nextLevelNumber: number | null;
    /** Time until the next break starts, if there is one. */
    untilNextBreak: number | null;
    elapsed: number;
}

function makeSnapshot(clock: Clock, s: Structure, now: number): ClockSnapshot {
    const rounds = s.rounds;
    const index = rounds.length === 0 ? 0 : Math.min(clock.roundIndex, rounds.length - 1);
    const round = rounds[index] ?? pause(0);
    const remaining = clock.remaining(now);
    const state = clock.toJSON();
    const later = rounds.slice(index + 1);
    const nextLevelOffset = later.findIndex((r) => !isBreak(r));
    const breakOffset = later.findIndex(isBreak);
    return {
        roundIndex: index,
        round,
        levelNumber: levelNumber(s, index),
        levelCount: levelCount(s),
        remaining,
        endsAt: 'endsAt' in state.mode ? state.mode.endsAt : null,
        progress: duration(round) > 0 ? Math.min(1, Math.max(0, 1 - remaining / duration(round))) : 1,
        isRunning: clock.isRunning,
        hasStarted: clock.hasStarted,
        isFinished: clock.isFinished,
        isBreak: isBreak(round),
        nextRound: later[0] ?? null,
        nextLevel: nextLevelOffset >= 0 ? later[nextLevelOffset] : null,
        nextLevelNumber: nextLevelOffset >= 0 ? levelNumber(s, index + 1 + nextLevelOffset) : null,
        untilNextBreak: breakOffset >= 0 ? remaining + later.slice(0, breakOffset).reduce((sum, r) => sum + duration(r), 0) : null,
        elapsed: clock.elapsed(now),
    };
}
