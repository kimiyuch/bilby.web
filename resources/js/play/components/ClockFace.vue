<script setup lang="ts">
// The clock face (ClockView.swift): level, blinds, countdown, progress and what comes next. It fills its
// container and scales with it, from a card on the page up to a projector.
import { computed } from 'vue';
import type { ClockSnapshot } from '../kit/clock';
import { TimeFormat, anteText, blindsText, chips, money, shortText } from '../kit/format';
import { type PrizePool, averageStack, total } from '../kit/prizePool';

const props = defineProps<{
    snapshot: ClockSnapshot;
    structureName: string;
    warningSeconds: number;
    /** Shown in a second footer row once players have entered. */
    pool?: PrizePool | null;
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
    return shortText(next);
});

/** About 12 characters fit a footer column; longer values shrink, down to 60 % (minimumScaleFactor in the app). */
const fit = (value: string) => Math.max(0.6, Math.min(1, 12 / value.length));

const items = computed(() => {
    const s = props.snapshot;
    const list: [string, string][] = [
        ['NEXT', next.value],
        ['NEXT BREAK', s.untilNextBreak === null ? '–' : TimeFormat.countdown(s.untilNextBreak)],
        ['ELAPSED', TimeFormat.elapsed(s.elapsed)],
    ];
    const p = props.pool;
    if (p && p.entries > 0) {
        const average = averageStack(p);
        list.push(
            ['PLAYERS', `${p.playersLeft} / ${p.entries}`],
            ['AVERAGE STACK', average === null ? '–' : chips(average)],
            ['PRIZE POOL', money(total(p), p.currency)],
        );
    }
    return list;
});
</script>

<template>
    <div class="face" :data-theme="theme">
        <div class="inner" :class="{ 'two-rows': items.length > 3 }">
            <div class="header">
                <div class="title">{{ title }}</div>
                <div class="header-end">
                    <span v-if="pill" class="pill">{{ pill }}</span>
                    <span class="name">{{ structureName }}</span>
                </div>
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
                <div v-for="[label, value] in items" :key="label">
                    <dt>{{ label }}</dt>
                    <dd :style="{ '--fit': fit(value) }">{{ value }}</dd>
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
 * wide and its contents add up to about 62 high (73 with a second footer row), so it fits either way.
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
    padding: calc(var(--u) * 3.5) calc(var(--u) * 5);
    gap: calc(var(--u) * 1.6);
    font-variant-numeric: tabular-nums;
}
.inner.two-rows {
    --u: min(1cqw, calc(100cqh / 73));
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
    .footer {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
    .footer dd {
        font-size: calc(var(--u-foot) * 3.4 * var(--fit, 1));
    }
}

.header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: calc(var(--u-head) * 2);
}
.title {
    font-size: calc(var(--u-head) * 4.4);
    line-height: 1.2;
    font-weight: 600;
    letter-spacing: 0.07em;
    color: var(--accent);
    transition: color 0.6s ease-in-out;
    white-space: nowrap;
}
.header-end {
    display: flex;
    align-items: baseline;
    min-width: 0;
    gap: calc(var(--u-head) * 1);
}
.pill {
    font-size: calc(var(--u-head) * 2);
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--bg);
    background: var(--accent);
    border-radius: 999px;
    padding: calc(var(--u-head) * 0.5) calc(var(--u-head) * 1.4);
    transition: background-color 0.6s ease-in-out, color 0.6s ease-in-out;
}
.name {
    font-size: calc(var(--u-head) * 2.4);
    font-weight: 500;
    color: var(--secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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

.footer {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    column-gap: calc(var(--u-foot) * 3);
    row-gap: calc(var(--u-foot) * 2.2);
    margin: 0;
}
.footer dt {
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
