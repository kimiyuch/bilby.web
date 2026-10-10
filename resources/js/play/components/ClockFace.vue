<script setup lang="ts">
// The clock face (ClockView.swift): level, blinds, countdown, progress and what comes next. It fills its
// container and scales with it, from a card on the page up to a projector.
import { computed } from 'vue';
import type { ClockSnapshot } from '../kit/clock';
import { TimeFormat, anteText, blindsText, compactChips, compactText, money } from '../kit/format';
import { type PrizePool, averageStack, chipsInPlay, payouts, total } from '../kit/prizePool';
import Money from './Money.vue';

const props = defineProps<{
    snapshot: ClockSnapshot;
    warningSeconds: number;
    /** Its numbers take turns in the middle of the footer once players have entered. */
    pool?: PrizePool | null;
    /** Seconds since 1970; drives the turns. */
    now: number;
}>();

/** Always dark: calm during play, warm amber when a level is about to end, teal on a break. */
const theme = computed(() => {
    const s = props.snapshot;
    if (s.isBreak) return 'break';
    if (s.hasStarted && !s.isFinished && props.warningSeconds > 0 && s.remaining <= props.warningSeconds) return 'ending';
    return 'play';
});

const title = computed(() => (props.snapshot.levelNumber ? `LEVEL ${props.snapshot.levelNumber}` : 'BREAK'));

const pill = computed(() => {
    const s = props.snapshot;
    if (s.isFinished) return 'FINISHED';
    if (!s.isRunning) return s.hasStarted ? 'PAUSED' : 'READY';
    return null;
});

const countdown = computed(() => TimeFormat.countdown(props.snapshot.remaining));

const next = computed(() => {
    const next = props.snapshot.nextRound;
    if (!next) return 'Last level';
    if (next.type === 'break') return `Break · ${next.minutes} min`;
    return compactText(next);
});

/** About 12 characters fit a footer column; longer values shrink, down to 60 % (minimumScaleFactor in the app). */
const fit = (value: string) => Math.max(0.6, Math.min(1, 12 / value.length));

/** The footer: the next level on the left, the next break on the right. */
const nextBreak = computed(() => {
    const s = props.snapshot;
    return s.untilNextBreak === null ? '–' : TimeFormat.countdown(s.untilNextBreak);
});

const timeOfDay = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

/** What takes turns in the middle of the footer: where we are, the players and the money, and what time things happen. */
const stats = computed(() => {
    const s = props.snapshot;
    /** [label, text], or [label, text, amount] for money, which shows its currency first and smaller. */
    const list: [string, string, number?][] = [];
    if (s.levelNumber !== null) list.push(['LEVELS', `${s.levelNumber} / ${s.levelCount}`]);
    const p = props.pool;
    if (p && p.entries > 0) {
        const average = averageStack(p);
        list.push(['PLAYERS', `${p.playersLeft} / ${p.entries}`]);
        if (average !== null) {
            list.push(['AVERAGE STACK', compactChips(average)]);
            if (!s.isBreak && s.round.bigBlind > 0) list.push(['AVERAGE IN BB', `${Math.round(average / s.round.bigBlind)} BB`]);
        }
        if (total(p) > 0) {
            list.push(['PRIZE POOL', money(total(p), p.currency), total(p)]);
            list.push(['FIRST PLACE', money(payouts(p)[0] ?? 0, p.currency), payouts(p)[0] ?? 0]);
        }
        list.push(['CHIPS IN PLAY', compactChips(chipsInPlay(p))]);
    }
    if (s.isRunning && s.endsAt !== null) {
        list.push([s.isBreak ? 'BREAK ENDS AT' : 'LEVEL ENDS AT', timeOfDay.format(new Date(s.endsAt * 1000))]);
        if (s.untilNextBreak !== null) list.push(['BREAK AT', timeOfDay.format(new Date((props.now + s.untilNextBreak) * 1000))]);
    }
    return list;
});

/** Each stat stays for a few seconds. Counted from the clock, so every window shows the same one. */
const statSeconds = 12;
const stat = computed(() => {
    const list = stats.value;
    if (list.length === 0) return null;
    return list[Math.floor(props.now / statSeconds) % list.length];
});
</script>

<template>
    <div class="face" :data-theme="theme">
        <div class="inner">
            <div class="header">
                <div class="title">{{ title }}</div>
                <span v-if="pill" class="pill">{{ pill }}</span>
                <div class="corner"><slot name="corner" /></div>
            </div>

            <div class="middle">
                <div class="countdown" :class="{ long: countdown.length > 5, dim: snapshot.hasStarted && !snapshot.isRunning }">
                    {{ countdown }}
                </div>
                <template v-if="snapshot.isBreak">
                    <div class="note">{{ snapshot.round.note || 'Break' }}</div>
                </template>
                <template v-else>
                    <div class="blinds">{{ blindsText(snapshot.round) }}</div>
                    <div class="ante">{{ anteText(snapshot.round) ?? ' ' }}</div>
                </template>
                <div class="track">
                    <div class="bar" :style="{ width: `max(var(--bar-h), ${snapshot.progress * 100}%)` }"></div>
                </div>
            </div>

            <dl class="footer">
                <div>
                    <dt>NEXT</dt>
                    <dd :style="{ '--fit': fit(next) }">{{ next }}</dd>
                </div>
                <Transition name="stat" mode="out-in">
                    <div v-if="stat" :key="stat[0]" class="stat">
                        <dt>{{ stat[0] }}</dt>
                        <dd :style="{ '--fit': fit(stat[1]) }">
                            <Money v-if="stat[2] !== undefined" :amount="stat[2]" :currency="pool!.currency" />
                            <template v-else>{{ stat[1] }}</template>
                        </dd>
                    </div>
                    <div v-else class="stat"></div>
                </Transition>
                <div class="end">
                    <dt>NEXT BREAK</dt>
                    <dd>{{ nextBreak }}</dd>
                </div>
            </dl>
        </div>
    </div>
</template>

<style scoped>
.face {
    --bg: #101316;
    --accent: #9eb5c9;
    --primary: #f5f5f5;
    --secondary: #9e9e9e;
    container-type: size;
    width: 100%;
    height: 100%;
    background: var(--bg);
    color: var(--primary);
    transition: background-color 0.6s ease-in-out;
    overflow: hidden;
}
.face[data-theme='ending'] {
    --bg: #291b09;
    --accent: #f5ad45;
}
.face[data-theme='break'] {
    --bg: #092120;
    --accent: #63ccb8;
}

/*
 * Everything is sized from one unit, so the layout keeps its proportions at any size. The face is 100 units
 * wide and its contents add up to about 62 high.
 */
.inner {
    --u: min(1cqw, calc(100cqh / 62));
    --u-head: var(--u);
    --u-count: var(--u);
    --u-blinds: var(--u);
    --u-foot: var(--u);
    --bar-h: max(4px, calc(var(--u) * 1.1));
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: calc(var(--u) * 3);
    gap: calc(var(--u) * 1.6);
    font-variant-numeric: tabular-nums;
}

/* Portrait, e.g. a phone held upright: size things from the width and stack the footer in two columns. */
@container (aspect-ratio < 10 / 11) {
    .inner {
        --u: calc(100cqw / 100);
        --u-head: calc(100cqw / 80);
        --u-count: calc(100cqw / 62);
        --u-blinds: calc(100cqw / 80);
        --u-foot: calc(100cqw / 66);
        gap: calc(var(--u) * 3);
    }
    .inner .footer dd {
        font-size: calc(var(--u-foot) * 3 * var(--fit, 1));
    }
    /* On a narrow screen the outer columns take what they need, the stat the rest (more specific than below). */
    .inner .footer {
        grid-template-columns: auto minmax(0, 1fr) auto;
    }
}

/* The level on the left, the paused pill in the middle, and a slot on the right (the full screen button). */
.header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: calc(var(--u-head) * 2);
}
.title {
    font-size: calc(var(--u-head) * 4.4);
    /* Only as tall as the capitals, so the space above them matches the padding at the side. */
    line-height: 1;
    text-box: trim-both cap alphabetic;
    font-weight: 600;
    letter-spacing: 0.07em;
    color: var(--accent);
    transition: color 0.6s ease-in-out;
    white-space: nowrap;
}
.corner {
    grid-column: 3;
    display: flex;
    justify-content: flex-end;
}
/* As tall as the level title, and flush with the right edge of the content. */
.corner :slotted(button) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: calc(var(--u-head) * 4.4 * 1.2);
    height: calc(var(--u-head) * 4.4 * 1.2);
    margin-right: calc(var(--u-head) * -1.584);
    /* Centered on the title without making the row taller. */
    margin-block: calc(var(--u-head) * -2);
    border-radius: 999px;
    color: rgb(255 255 255 / 0.4);
    transition: color 0.2s, background-color 0.2s;
}
/* At least 48 × 48 to tap on a touch screen. */
@media (pointer: coarse) {
    .corner :slotted(button) {
        position: relative;
    }
    .corner :slotted(button)::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: max(100%, 3rem);
        height: max(100%, 3rem);
        translate: -50% -50%;
    }
}
.corner :slotted(button:hover) {
    color: white;
    background: rgb(255 255 255 / 0.1);
}
.corner :slotted(svg) {
    width: 50%;
    height: 50%;
}
.pill {
    grid-column: 2;
    line-height: 1.2;
    margin-block: calc(var(--u-head) * -1);
    font-size: calc(var(--u-head) * 2);
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--bg);
    background: var(--accent);
    border-radius: 999px;
    padding: calc(var(--u-head) * 0.5) calc(var(--u-head) * 1.4);
    transition: background-color 0.6s ease-in-out, color 0.6s ease-in-out;
}

.middle {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: var(--u);
    min-height: 0;
}
.countdown {
    margin-bottom: calc(var(--u) * 2);
    font-size: calc(var(--u-count) * 19);
    font-weight: 500;
    line-height: 1;
    letter-spacing: -0.02em;
    white-space: nowrap;
    transition: opacity 0.3s;
}
/* h:mm:ss is two characters wider than mm:ss. */
.countdown.long {
    font-size: calc(var(--u-count) * 19 * 0.74);
}
.countdown.dim {
    opacity: 0.55;
}
.blinds {
    font-size: calc(var(--u-blinds) * 8);
    font-weight: 600;
    line-height: 1.05;
    white-space: nowrap;
}
.ante {
    font-size: calc(var(--u-blinds) * 3.4);
    font-weight: 500;
    line-height: 1.2;
    color: var(--secondary);
    margin-top: calc(var(--u) * -0.5);
}
.note {
    font-size: calc(var(--u-blinds) * 6);
    font-weight: 600;
    line-height: 1.15;
    text-align: center;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-wrap: balance;
}
.track {
    flex-shrink: 0;
    align-self: stretch;
    height: var(--bar-h);
    margin-top: var(--u);
    border-radius: 999px;
    background: rgb(255 255 255 / 0.1);
    overflow: hidden;
}
.bar {
    height: 100%;
    border-radius: 999px;
    background: var(--accent);
    transition: background-color 0.6s ease-in-out;
}

/* The next level on the left, a stat in the middle that changes every few seconds, the next break on the right. */
.footer {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    column-gap: calc(var(--u-foot) * 3);
    margin: 0;
}
.footer .stat {
    text-align: center;
}
.footer .end {
    text-align: right;
}
.stat-enter-active,
.stat-leave-active {
    transition: opacity 0.4s ease, translate 0.4s ease;
}
.stat-enter-from {
    opacity: 0;
    translate: 0 calc(var(--u-foot) * 1);
}
.stat-leave-to {
    opacity: 0;
    translate: 0 calc(var(--u-foot) * -1);
}
.footer dt {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: calc(var(--u-foot) * 1.9);
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--secondary);
}
.footer dd {
    margin: calc(var(--u-foot) * 0.5) 0 0;
    font-size: calc(var(--u-foot) * 4.2 * var(--fit, 1));
    line-height: 1.2;
    min-height: calc(var(--u-foot) * 4.2 * 1.2);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>
