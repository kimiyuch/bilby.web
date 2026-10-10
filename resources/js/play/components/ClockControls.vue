<script setup lang="ts">
// Start/pause, next/previous, ±1 minute, restart and reset (ClockControls.swift). Space, the arrow keys and M
// work anywhere on the page.
import { confirm } from '../confirm';
import * as store from '../store';
import Icon from './Icon.vue';

const reset = async () => {
    const ok = await confirm({
        title: 'Reset the clock?',
        message: 'The clock goes back to level 1 and stops.',
        action: 'Reset',
        destructive: true,
    });
    if (ok) store.resetClock();
};
</script>

<template>
    <div class="flex flex-wrap items-center justify-center gap-3">
        <div class="flex items-center gap-x-2 max-sm:order-2">
            <button type="button" class="btn btn-icon" title="Previous level (←)" aria-label="Previous level" @click="store.previous">
                <Icon name="backward" />
            </button>
            <button type="button" class="btn btn-icon" title="Start this level again" aria-label="Restart level" @click="store.restartRound">
                <Icon name="arrow-path" />
            </button>
            <button type="button" class="btn tabular-nums" title="Take a minute off (↓)" @click="store.adjust(-1)">−1 min</button>
        </div>

        <button
            type="button"
            class="btn btn-primary min-w-36 px-6 py-3 text-base/6 max-sm:order-1 max-sm:w-full"
            title="Start or pause (space)"
            @click="store.toggle"
        >
            <Icon :name="store.isRunning.value ? 'pause' : 'play'" />
            {{ store.isRunning.value ? 'Pause' : 'Start' }}
        </button>

        <div class="flex items-center gap-x-2 max-sm:order-3">
            <button type="button" class="btn tabular-nums" title="Add a minute (↑)" @click="store.adjust(1)">+1 min</button>
            <button
                type="button"
                class="btn btn-icon"
                title="Back to level 1, stopped"
                aria-label="Reset clock"
                :disabled="!store.tournament.value.clock.hasStarted"
                @click="reset"
            >
                <Icon name="stop" />
            </button>
            <button type="button" class="btn btn-icon" title="Next level (→)" aria-label="Next level" @click="store.next">
                <Icon name="forward" />
            </button>
            <button
                type="button"
                class="btn btn-icon ml-2"
                :title="store.settings.muted ? 'Sounds are off (M)' : 'Sounds are on (M)'"
                :aria-label="store.settings.muted ? 'Unmute' : 'Mute'"
                :aria-pressed="store.settings.muted"
                @click="store.settings.muted = !store.settings.muted"
            >
                <Icon :name="store.settings.muted ? 'speaker-x-mark' : 'speaker-wave'" />
            </button>
        </div>
    </div>
</template>
