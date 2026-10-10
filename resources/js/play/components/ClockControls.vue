<script setup lang="ts">
// Previous, start/pause and next. Space and the arrow keys work anywhere on the page.
import * as store from '../store';
import Icon from './Icon.vue';
</script>

<template>
    <div class="flex items-center justify-center gap-x-3">
        <button type="button" class="btn btn-icon size-11" title="Previous level (←)" aria-label="Previous level" @click="store.previous">
            <Icon name="backward" />
        </button>

        <button
            type="button"
            class="btn btn-primary size-16 p-0 [&>svg]:size-7"
            :aria-label="store.isRunning.value ? 'Pause' : 'Start'"
            title="Start or pause (space)"
            @click="store.toggle"
        >
            <!-- The play triangle looks centered when it sits a little to the right. -->
            <Icon :name="store.isRunning.value ? 'pause' : 'play'" :class="{ 'translate-x-0.5': !store.isRunning.value }" />
        </button>

        <button type="button" class="btn btn-icon size-11" title="Next level (→)" aria-label="Next level" @click="store.next">
            <Icon name="forward" />
        </button>
    </div>
</template>
