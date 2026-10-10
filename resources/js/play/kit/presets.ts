// The structures Bilby ships with (Presets.swift). All assume 25, 100, 500 and 1000 chips (plus 5000 for the deep stack).

import { type Round, type Structure, level, pause, structure } from './structure';

const L = (sb: number, bb: number, minutes: number, ante = 0): Round => level(sb, bb, minutes, ante);

/** 10,000 chips, 20 minute levels. */
export function standard(): Structure {
    return structure('Standard home game', [
        L(25, 50, 20), L(50, 100, 20), L(75, 150, 20), L(100, 200, 20),
        pause(10),
        L(100, 200, 20, 200), L(150, 300, 20, 300), L(200, 400, 20, 400), L(250, 500, 20, 500),
        pause(15, 'Color up the 25s'),
        L(300, 600, 20, 600), L(400, 800, 20, 800), L(500, 1000, 20, 1000), L(600, 1200, 20, 1200),
        pause(10, 'Color up the 100s'),
        L(1000, 2000, 20, 2000), L(1500, 3000, 20, 3000), L(2000, 4000, 20, 4000), L(3000, 6000, 20, 6000),
        L(4000, 8000, 20, 8000), L(5000, 10000, 20, 10000),
    ]);
}

/** 10,000 chips, 10 minute levels. */
export function turbo(): Structure {
    return structure('Turbo', [
        L(25, 50, 10), L(50, 100, 10), L(75, 150, 10), L(100, 200, 10), L(150, 300, 10, 300),
        pause(10, 'Color up the 25s'),
        L(200, 400, 10, 400), L(300, 600, 10, 600), L(400, 800, 10, 800), L(500, 1000, 10, 1000),
        L(600, 1200, 10, 1200), L(800, 1600, 10, 1600),
        pause(10, 'Color up the 100s'),
        L(1000, 2000, 10, 2000), L(1500, 3000, 10, 3000), L(2000, 4000, 10, 4000), L(3000, 6000, 10, 6000),
        L(4000, 8000, 10, 8000), L(5000, 10000, 10, 10000),
    ]);
}

/** 25,000 chips, 30 minute levels. */
export function deepStack(): Structure {
    return structure('Deep stack', [
        L(25, 50, 30), L(50, 100, 30), L(75, 150, 30), L(100, 200, 30),
        pause(10),
        L(150, 300, 30, 300), L(200, 400, 30, 400), L(250, 500, 30, 500), L(300, 600, 30, 600),
        pause(15, 'Color up the 25s'),
        L(400, 800, 30, 800), L(500, 1000, 30, 1000), L(600, 1200, 30, 1200), L(800, 1600, 30, 1600),
        pause(10, 'Color up the 100s'),
        L(1000, 2000, 30, 2000), L(1500, 3000, 30, 3000), L(2000, 4000, 30, 4000), L(2500, 5000, 30, 5000),
        L(3000, 6000, 30, 6000), L(4000, 8000, 30, 8000), L(5000, 10000, 30, 10000), L(6000, 12000, 30, 12000),
        L(8000, 16000, 30, 16000), L(10000, 20000, 30, 20000),
    ]);
}

/** Fresh copies with new IDs each time. */
export const allPresets = (): Structure[] => [standard(), turbo(), deepStack()];
