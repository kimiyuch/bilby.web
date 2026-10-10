<script setup lang="ts">
// The clock face, redrawn from the store. With `overlay`, moving the pointer or tapping shows a few controls
// over it for a while (full screen and the big screen window), then they and the pointer hide again.
import { computed, onBeforeUnmount, ref } from 'vue';
import * as store from '../store';
import ClockFace from './ClockFace.vue';
import Icon from './Icon.vue';

const props = withDefaults(defineProps<{ overlay?: boolean; isFullScreen?: boolean }>(), { overlay: false, isFullScreen: false });
const emit = defineEmits<{ fullScreen: [] }>();

const snapshot = computed(() => store.snapshot(store.now.value));

const controlsVisible = ref(false);
let hideTimer: number | undefined;
const show = () => {
    if (!props.overlay) return;
    controlsVisible.value = true;
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => (controlsVisible.value = false), 2500);
};
onBeforeUnmount(() => window.clearTimeout(hideTimer));
</script>

<template>
    <div class="relative size-full" :class="{ 'cursor-none': overlay && !controlsVisible }" @pointermove="show" @pointerdown="show">
        <ClockFace
            :snapshot="snapshot"
            :structure-name="store.tournament.value.structure.name"
            :warning-seconds="store.settings.warningSeconds"
            :pool="store.tournament.value.prizePool"
        />
        <div
            v-if="overlay"
            class="absolute inset-x-0 bottom-0 flex justify-center p-4 transition-opacity duration-300"
            :class="controlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0'"
            @dblclick.stop
        >
            <div class="flex items-center gap-x-1 rounded-full bg-black/60 p-1.5 text-white shadow-lg ring-1 ring-white/10 backdrop-blur">
                <button type="button" class="overlay-btn" aria-label="Previous level" title="Previous level (←)" @click="store.previous">
                    <Icon name="backward" />
                </button>
                <button type="button" class="overlay-btn" :aria-label="store.isRunning.value ? 'Pause' : 'Start'" title="Start or pause (space)" @click="store.toggle">
                    <Icon :name="store.isRunning.value ? 'pause' : 'play'" />
                </button>
                <button type="button" class="overlay-btn" aria-label="Next level" title="Next level (→)" @click="store.next">
                    <Icon name="forward" />
                </button>
                <span class="mx-1 h-5 w-px bg-white/20"></span>
                <button
                    type="button"
                    class="overlay-btn"
                    :aria-label="isFullScreen ? 'Exit full screen' : 'Full screen'"
                    :title="isFullScreen ? 'Exit full screen' : 'Full screen'"
                    @click="emit('fullScreen')"
                >
                    <Icon :name="isFullScreen ? 'arrows-pointing-in' : 'arrows-pointing-out'" />
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
@reference '../../../css/play.css';

.overlay-btn {
    @apply flex size-10 items-center justify-center rounded-full hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white;
}
.overlay-btn > svg {
    @apply size-5;
}
</style>
