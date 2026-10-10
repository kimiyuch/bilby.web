<script setup lang="ts">
// The clock with its controls underneath, and the ways to put it on a bigger screen.
import { ref } from 'vue';
import { soundBlocked } from '../alerts';
import { useFullScreen } from '../fullscreen';
import * as store from '../store';
import ClockControls from './ClockControls.vue';
import Icon from './Icon.vue';
import LiveClock from './LiveClock.vue';

const face = ref<HTMLElement>();
const { isFullScreen, pinned, toggle } = useFullScreen(face);

// A tap on the clock makes it full screen on phones and tablets, like the iOS app; a mouse double-clicks.
let pointerType = '';
const tap = () => {
    if (pointerType === 'touch' && !isFullScreen.value) toggle();
};
</script>

<template>
    <div class="mx-auto flex max-w-6xl flex-col gap-y-6 px-4 pb-10 sm:px-6 lg:px-8">
        <div
            ref="face"
            class="overflow-hidden bg-felt"
            :class="pinned
                ? 'fixed inset-0 z-50'
                : isFullScreen
                    ? ''
                    : 'relative aspect-[4/5] w-full rounded-xl shadow-2xl ring-1 ring-chip-950/20 sm:aspect-[100/62] sm:max-h-[calc(100dvh-15rem)] sm:min-h-80'"
            @dblclick="toggle"
            @pointerdown="pointerType = $event.pointerType"
            @click="tap"
        >
            <LiveClock :overlay="isFullScreen" :is-full-screen="isFullScreen" @full-screen="toggle">
                <template #corner>
                    <button
                        v-if="!isFullScreen"
                        type="button"
                        class="focus-visible:outline-2 focus-visible:outline-white"
                        title="Full screen (or double-click the clock)"
                        aria-label="Full screen"
                        @click.stop="toggle"
                        @dblclick.stop
                    >
                        <Icon name="arrows-pointing-out" />
                    </button>
                </template>
            </LiveClock>
        </div>

        <ClockControls />

        <p
            v-if="soundBlocked && !store.settings.muted && store.isRunning.value"
            class="mx-auto rounded-full bg-ochre-100 px-4 py-1.5 text-center text-sm/6 font-medium text-ochre-900"
        >
            Your browser keeps Bilby quiet until you click somewhere on the page.
        </p>

        <div class="space-y-4 text-center text-sm/6 text-neutral-500">
            <p>
                Playing
                <a href="#structure" class="font-medium text-chip-700 underline decoration-chip-300 underline-offset-4 hover:decoration-chip-600">{{ store.tournament.value.structure.name }}</a>
            </p>
            <p class="max-sm:hidden">
                Space starts and pauses · ← → change the level · ↑ ↓ add or take a minute · M mutes · double-click the clock for full screen
            </p>
        </div>
    </div>
</template>
