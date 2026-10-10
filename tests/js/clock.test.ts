// Ported from BilbyKit/Tests/BilbyKitTests/ClockTests.swift.

import { describe, expect, test } from 'vitest';
import { Clock } from '../../resources/js/play/kit/clock';
import { level, pause, structure as makeStructure } from '../../resources/js/play/kit/structure';

const t0 = 1_800_000_000;
const at = (seconds: number) => t0 + seconds;

/** Level 1 (10 min), level 2 (10 min), break (5 min), level 3 (10 min). */
const structure = makeStructure('Test', [
    level(25, 50, 10),
    level(50, 100, 10),
    pause(5, 'Color up the 25s'),
    level(100, 200, 10, 200),
]);

describe('Clock', () => {
    test('starts paused on the first level', () => {
        const s = Clock.start(structure).snapshot(structure, t0);
        expect(s.roundIndex).toBe(0);
        expect(s.levelNumber).toBe(1);
        expect(s.levelCount).toBe(3);
        expect(s.remaining).toBe(600);
        expect(s.isRunning || s.hasStarted).toBe(false);
        expect(s.nextLevel?.bigBlind).toBe(100);
        expect(s.untilNextBreak).toBe(1200);
    });

    test('counts down from the end date', () => {
        const clock = Clock.start(structure);
        clock.start(structure, t0);
        const s = clock.snapshot(structure, at(90));
        expect(s.remaining).toBe(510);
        expect(s.endsAt).toBe(at(600));
        expect(s.progress).toBeCloseTo(0.15, 9);
        expect(s.elapsed).toBe(90);
    });

    test('pause freezes time and resume continues', () => {
        const clock = Clock.start(structure);
        clock.start(structure, t0);
        clock.pause(structure, at(100));
        expect(clock.snapshot(structure, at(5000)).remaining).toBe(500);
        expect(clock.elapsed(at(5000))).toBe(100);
        clock.start(structure, at(5000));
        const s = clock.snapshot(structure, at(5100));
        expect(s.remaining).toBe(400);
        expect(s.elapsed).toBe(200);
    });

    test('catches up after sleep or reload', () => {
        const clock = Clock.start(structure);
        clock.start(structure, t0);
        // Saved and restored, then read 23 minutes later: into the break.
        const restored = Clock.decode(JSON.parse(JSON.stringify(clock)), structure);
        const s = restored.snapshot(structure, at(23 * 60));
        expect(s.roundIndex).toBe(2);
        expect(s.isBreak).toBe(true);
        expect(s.levelNumber).toBeNull();
        expect(s.remaining).toBe(120);
        expect(s.nextLevelNumber).toBe(3);
        expect(s.isRunning).toBe(true);
    });

    test('stops after the last round', () => {
        const clock = Clock.start(structure);
        clock.start(structure, t0);
        const s = clock.snapshot(structure, at(10_000));
        expect(s.roundIndex).toBe(3);
        expect(s.isFinished).toBe(true);
        expect(s.isRunning).toBe(false);
        expect(s.remaining).toBe(0);
        expect(s.elapsed).toBe(35 * 60);
        // Starting again does nothing until time is added.
        const c = clock.caughtUp(structure, at(10_000));
        c.start(structure, at(10_000));
        expect(c.isRunning).toBe(false);
        c.adjust(60, structure, at(10_000));
        c.start(structure, at(10_000));
        expect(c.snapshot(structure, at(10_030)).remaining).toBe(30);
    });

    test('next and previous start rounds fresh', () => {
        const clock = Clock.start(structure);
        clock.start(structure, t0);
        clock.next(structure, at(200));
        let s = clock.snapshot(structure, at(200));
        expect([s.roundIndex, s.remaining, s.isRunning]).toEqual([1, 600, true]);
        clock.previous(structure, at(260));
        s = clock.snapshot(structure, at(260));
        expect([s.roundIndex, s.remaining]).toEqual([0, 600]);
        clock.previous(structure, at(260));
        expect(clock.roundIndex).toBe(0);

        const paused = Clock.start(structure);
        paused.next(structure, t0);
        expect(paused.snapshot(structure, at(999)).remaining).toBe(600);
        expect(paused.isRunning).toBe(false);
        for (let i = 0; i < 10; i++) paused.next(structure, t0);
        expect(paused.roundIndex).toBe(3);
    });

    test('adjust adds and removes time', () => {
        const clock = Clock.start(structure);
        clock.start(structure, t0);
        clock.adjust(60, structure, at(30));
        expect(clock.snapshot(structure, at(30)).remaining).toBe(630);
        clock.adjust(-60, structure, at(30));
        clock.adjust(-60, structure, at(30));
        expect(clock.snapshot(structure, at(30)).remaining).toBe(510);
        // Removing more than is left ends the level.
        clock.adjust(-600, structure, at(30));
        const s = clock.snapshot(structure, at(30));
        expect([s.roundIndex, s.remaining]).toEqual([1, 600]);

        const paused = Clock.start(structure);
        paused.adjust(-900, structure, t0);
        expect(paused.remaining(t0)).toBe(0);
        expect(paused.roundIndex).toBe(0);
    });

    test('restart round', () => {
        const clock = Clock.start(structure);
        clock.start(structure, t0);
        clock.restartRound(structure, at(400));
        expect(clock.snapshot(structure, at(400)).remaining).toBe(600);
    });

    test('toggle', () => {
        const clock = Clock.start(structure);
        clock.toggle(structure, t0);
        expect(clock.isRunning).toBe(true);
        clock.toggle(structure, at(10));
        expect(clock.isRunning).toBe(false);
        expect(clock.remaining(at(99))).toBe(590);
    });

    test('until next break', () => {
        const clock = Clock.start(structure);
        clock.start(structure, t0);
        expect(clock.snapshot(structure, at(60)).untilNextBreak).toBe(1140);
        // In the break and after it there is no further break.
        expect(clock.snapshot(structure, at(1300)).untilNextBreak).toBeNull();
    });

    test('follows the round when the structure is edited', () => {
        const clock = Clock.start(structure);
        clock.start(structure, t0);
        clock.next(structure, at(60)); // level 2, ends at 660
        const edited = structuredClone(structure);
        edited.rounds.splice(0, 0, level(10, 20, 10));
        edited.rounds[2].minutes = 12; // level 2 is now two minutes longer
        clock.structureChanged(structure, edited, at(120));
        const s = clock.snapshot(edited, at(120));
        expect(s.roundIndex).toBe(2);
        expect(s.round.bigBlind).toBe(100);
        expect(s.remaining).toBe(540 + 120);

        // Deleting the current round carries on with the next one, from the top.
        const shorter = structuredClone(edited);
        shorter.rounds.splice(2, 1);
        clock.structureChanged(edited, shorter, at(120));
        const t = clock.snapshot(shorter, at(120));
        expect(t.isBreak && t.remaining === 300).toBe(true);
    });

    test('edits before the start use the new duration', () => {
        const clock = Clock.start(structure);
        const edited = structuredClone(structure);
        edited.rounds[0].minutes = 15;
        clock.structureChanged(structure, edited, t0);
        expect(clock.remaining(t0)).toBe(900);
    });

    test('upcoming events', () => {
        const clock = Clock.start(structure);
        expect(clock.upcomingEvents(structure, t0, 60)).toEqual([]);
        clock.start(structure, t0);
        expect(clock.upcomingEvents(structure, at(30), 60)).toEqual([
            { at: at(540), kind: 'warning', roundIndex: 0 },
            { at: at(600), kind: 'roundStarted', roundIndex: 1 },
            { at: at(1140), kind: 'warning', roundIndex: 1 },
            { at: at(1200), kind: 'roundStarted', roundIndex: 2 },
            { at: at(1440), kind: 'warning', roundIndex: 2 },
            { at: at(1500), kind: 'roundStarted', roundIndex: 3 },
            { at: at(2040), kind: 'warning', roundIndex: 3 },
            { at: at(2100), kind: 'finished', roundIndex: 3 },
        ]);
        // Past the first warning, it is no longer listed.
        expect(clock.upcomingEvents(structure, at(550), 60)[0].kind).toBe('roundStarted');
        expect(clock.upcomingEvents(structure, t0, 60, 3)).toHaveLength(3);
    });
});
