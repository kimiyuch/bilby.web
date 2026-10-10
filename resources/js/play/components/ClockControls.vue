<script setup lang="ts">
// Previous, start/pause and next; the rest (±1 minute, restart, mute, reset) in a menu. Space, the arrow keys
// and M work anywhere on the page.
import { confirm } from '../confirm';
import * as store from '../store';
import Icon from './Icon.vue';
import Menu from './Menu.vue';

/** `balanced` adds a spacer so the start button stays centered despite the menu button on the right. */
withDefaults(defineProps<{ balanced?: boolean }>(), { balanced: true });

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
    <div class="flex items-center justify-center gap-x-3">
        <!-- As wide as the menu button, so Start stays in the middle. -->
        <span v-if="balanced" class="size-11" aria-hidden="true"></span>
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

        <Menu label="More" up align="center" button-class="size-11">
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
    </div>
</template>

<style scoped>
@reference '../../../css/play.css';

kbd {
    @apply font-sans text-xs text-neutral-400;
}
</style>
