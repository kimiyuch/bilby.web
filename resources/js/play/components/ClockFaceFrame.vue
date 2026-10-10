<script setup lang="ts">
// The live clock in its frame, with the full screen button in the corner. The parent owns full screen; this is
// the element that goes full screen.
import Icon from './Icon.vue';
import LiveClock from './LiveClock.vue';

defineProps<{ isFullScreen: boolean; pinned: boolean; frame: string }>();
const emit = defineEmits<{ toggle: []; tap: [pointerType: string] }>();

let pointerType = '';
</script>

<template>
    <div
        class="overflow-hidden bg-felt"
        :class="pinned ? 'fixed inset-0 z-50' : isFullScreen ? '' : frame"
        @dblclick="emit('toggle')"
        @pointerdown="pointerType = $event.pointerType"
        @click="emit('tap', pointerType)"
    >
        <LiveClock :overlay="isFullScreen" :is-full-screen="isFullScreen" @full-screen="emit('toggle')">
            <template #corner>
                <button
                    v-if="!isFullScreen"
                    type="button"
                    class="focus-visible:outline-2 focus-visible:outline-white"
                    title="Full screen (or double-click the clock)"
                    aria-label="Full screen"
                    @click.stop="emit('toggle')"
                    @dblclick.stop
                >
                    <Icon name="arrows-pointing-out" />
                </button>
            </template>
        </LiveClock>
    </div>
</template>
