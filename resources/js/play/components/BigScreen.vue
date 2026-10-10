<script setup lang="ts">
// The clock on its own, for a TV or projector (BigScreen.swift). It runs in a window of its own, opened from the
// main window, and follows it through local storage; the main window keeps the controls and plays the sounds.
import { onMounted, ref } from 'vue';
import { useFullScreen } from '../fullscreen';
import LiveClock from './LiveClock.vue';

const root = ref<HTMLElement>();
const { isFullScreen, toggle } = useFullScreen(root);

onMounted(() => {
    document.title = 'Bilby Big Screen';
    document.documentElement.classList.add('bg-felt');
});
</script>

<template>
    <div ref="root" class="h-dvh w-screen bg-felt" @dblclick="toggle">
        <LiveClock overlay :is-full-screen="isFullScreen" @full-screen="toggle" />
    </div>
</template>
