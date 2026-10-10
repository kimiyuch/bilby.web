<script setup lang="ts">
// The clock's less common controls: a minute more or less, restart the level, mute and reset.
import { confirm } from '../confirm';
import * as store from '../store';
import Icon from './Icon.vue';
import Menu from './Menu.vue';

const addMinute = () => store.adjust(1);
const takeMinute = () => store.adjust(-1);
const toggleMute = () => (store.settings.muted = !store.settings.muted);

const reset = async () => {
    const ok = await confirm({
        title: 'Reset the clock?',
        message: 'The clock goes back to level 1 and stops.',
        action: 'Reset',
        destructive: true,
    });
    if (ok) store.resetClock();
};

/** Runs a menu item and closes the menu, except for ±1 minute, which can be pressed a few times. */
const run = (action: () => unknown, close: () => void, keepOpen = false) => {
    action();
    if (!keepOpen) close();
};
</script>

<template>
    <Menu label="More" up align="end" button-class="size-11">
        <template #icon>
            <Icon :name="store.settings.muted ? 'speaker-x-mark' : 'ellipsis-horizontal'" />
        </template>
        <template #default="{ close }">
            <button type="button" role="menuitem" class="menu-item" @click="run(addMinute, close, true)">
                Add a minute <kbd>↑</kbd>
            </button>
            <button type="button" role="menuitem" class="menu-item" @click="run(takeMinute, close, true)">
                Take a minute off <kbd>↓</kbd>
            </button>
            <button type="button" role="menuitem" class="menu-item" @click="run(store.restartRound, close)">
                Restart this level
            </button>
            <button type="button" role="menuitem" class="menu-item" @click="run(toggleMute, close)">
                {{ store.settings.muted ? 'Turn sounds on' : 'Mute' }} <kbd>M</kbd>
            </button>
            <hr class="menu-separator">
            <button
                type="button"
                role="menuitem"
                class="menu-item text-red-700"
                :disabled="!store.tournament.value.clock.hasStarted"
                @click="run(reset, close)"
            >
                Reset clock…
            </button>
        </template>
    </Menu>
</template>

<style scoped>
@reference '../../../css/play.css';

kbd {
    @apply font-sans text-xs text-neutral-400;
}
</style>
