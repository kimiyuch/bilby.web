<script setup lang="ts">
// Previous, start/pause and next; the rest (±1 minute, restart, mute, reset) in a menu. Space, the arrow keys
// and M work anywhere on the page.
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { confirm } from '../confirm';
import * as store from '../store';
import Icon from './Icon.vue';

const open = ref(false);
const menu = ref<HTMLElement>();

const close = (event: Event) => {
    if (open.value && !menu.value?.contains(event.target as Node)) open.value = false;
};
const escape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') open.value = false;
};
onMounted(() => {
    document.addEventListener('pointerdown', close);
    window.addEventListener('keydown', escape);
});
onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', close);
    window.removeEventListener('keydown', escape);
});

/** Runs a menu item; the menu stays open for ±1 minute, so it can be pressed a few times. */
const run = (action: () => void, keepOpen = false) => {
    action();
    if (!keepOpen) open.value = false;
};

const addMinute = () => store.adjust(1);
const takeMinute = () => store.adjust(-1);
const toggleMute = () => (store.settings.muted = !store.settings.muted);

const reset = async () => {
    open.value = false;
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
    <div class="flex items-center justify-center gap-x-3">
        <!-- As wide as the menu button, so Start stays in the middle. -->
        <span class="size-11" aria-hidden="true"></span>
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

        <div ref="menu" class="relative">
            <button
                type="button"
                class="btn btn-plain btn-icon size-11"
                aria-label="More"
                title="More"
                aria-haspopup="menu"
                :aria-expanded="open"
                @click="open = !open"
            >
                <Icon :name="store.settings.muted ? 'speaker-x-mark' : 'ellipsis-horizontal'" />
            </button>
            <div
                v-if="open"
                role="menu"
                class="absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-xl bg-white p-1 text-sm/6 shadow-lg ring-1 ring-chip-950/10"
            >
                <button type="button" role="menuitem" class="menu-item" @click="run(addMinute, true)">
                    Add a minute <kbd>↑</kbd>
                </button>
                <button type="button" role="menuitem" class="menu-item" @click="run(takeMinute, true)">
                    Take a minute off <kbd>↓</kbd>
                </button>
                <button type="button" role="menuitem" class="menu-item" @click="run(store.restartRound)">
                    Restart this level
                </button>
                <button type="button" role="menuitem" class="menu-item" @click="run(toggleMute)">
                    {{ store.settings.muted ? 'Turn sounds on' : 'Mute' }} <kbd>M</kbd>
                </button>
                <hr class="my-1 border-neutral-950/5">
                <button
                    type="button"
                    role="menuitem"
                    class="menu-item text-red-700"
                    :disabled="!store.tournament.value.clock.hasStarted"
                    @click="reset"
                >
                    Reset clock…
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
@reference '../../../css/play.css';

.menu-item {
    @apply flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left hover:bg-chip-50 disabled:pointer-events-none disabled:opacity-40;
}
kbd {
    @apply font-sans text-xs text-neutral-400;
}
</style>
