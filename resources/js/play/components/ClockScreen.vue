<script setup lang="ts">
// The clock and its control strip, as one card like a media player: the structure being played on the left,
// previous, start/pause and next in the middle, and a menu with the rest on the right.
import { computed, ref } from 'vue';
import { soundBlocked } from '../alerts';
import { useFullScreen } from '../fullscreen';
import * as store from '../store';
import ClockControls from './ClockControls.vue';
import ClockMenu from './ClockMenu.vue';
import ClockFaceFrame from './ClockFaceFrame.vue';

const frame = ref<InstanceType<typeof ClockFaceFrame>>();
const face = computed(() => frame.value?.$el as HTMLElement | undefined);
const { isFullScreen, pinned, toggle } = useFullScreen(face);

// A tap on the clock makes it full screen on phones and tablets, like the iOS app; a mouse double-clicks.
const tap = (pointerType: string) => {
    if (pointerType === 'touch' && !isFullScreen.value) toggle();
};

const quiet = computed(() => soundBlocked.value && !store.settings.muted && store.isRunning.value);
</script>

<template>
    <div class="mx-auto flex max-w-6xl flex-col gap-y-4 px-6 pb-10 lg:px-8">
        <div class="rounded-2xl bg-ochre-50 shadow-2xl ring-1 ring-chip-950/10">
            <ClockFaceFrame
                ref="frame"
                :is-full-screen="isFullScreen"
                :pinned="pinned"
                frame="relative aspect-[4/5] w-full rounded-t-2xl sm:aspect-[100/62] sm:max-h-[calc(100dvh-14rem)] sm:min-h-80"
                @toggle="toggle"
                @tap="tap"
            />
            <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-x-4 p-3 sm:px-5">
                <div class="min-w-0 max-sm:sr-only">
                    <p class="text-xs/5 text-neutral-500">Playing</p>
                    <a href="#structure" class="block truncate text-sm/6 font-medium text-chip-800 hover:text-chip-600">
                        {{ store.tournament.value.structure.name }}
                    </a>
                </div>
                <ClockControls class="col-start-2" />
                <ClockMenu class="justify-self-end" />
            </div>
        </div>
        <p v-if="quiet" class="mx-auto rounded-full bg-ochre-100 px-4 py-1.5 text-center text-sm/6 font-medium text-ochre-900">
            Your browser keeps Bilby quiet until you click somewhere on the page.
        </p>
    </div>
</template>
