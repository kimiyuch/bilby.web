// Tournament.swift: the structure being played, the clock running through it, and the money.

import { Clock, type ClockSnapshot } from './clock';
import { type PrizePool, decodePrizePool, newPrizePool } from './prizePool';
import { standard } from './presets';
import { type Structure, decodeStructure, structuresEqual } from './structure';

export class Tournament {
    constructor(
        public structure: Structure,
        public clock: Clock,
        public prizePool: PrizePool,
    ) {}

    static fresh(structure: Structure = standard(), prizePool: PrizePool = newPrizePool()): Tournament {
        return new Tournament(structure, Clock.start(structure), prizePool);
    }

    static decode(raw: any): Tournament | null {
        const structure = decodeStructure(raw?.structure);
        if (!structure) return null;
        return new Tournament(structure, Clock.decode(raw.clock, structure), decodePrizePool(raw.prizePool));
    }

    toJSON() {
        return { structure: this.structure, clock: this.clock.toJSON(), prizePool: this.prizePool };
    }

    clone(): Tournament {
        return new Tournament(structuredClone(this.structure), this.clock.clone(), structuredClone(this.prizePool));
    }

    equals(other: Tournament): boolean {
        return JSON.stringify(this) === JSON.stringify(other);
    }

    /** Edits the structure while keeping the clock on the same round. */
    setStructure(next: Structure, now: number): void {
        if (structuresEqual(next, this.structure) || next.rounds.length === 0) return;
        this.clock.structureChanged(this.structure, next, now);
        this.structure = next;
    }

    /** Switches to a different structure and puts the clock back to its first level. */
    replaceStructure(next: Structure): void {
        if (next.rounds.length === 0) return;
        this.structure = next;
        this.clock = Clock.start(next);
    }

    snapshot(now: number): ClockSnapshot {
        return this.clock.snapshot(this.structure, now);
    }
}
