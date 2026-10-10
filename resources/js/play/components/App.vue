<script setup lang="ts">
// The main window: the website's header, with the app's four sections (Clock, Structure, Players, Settings) in a menu.
import { onBeforeUnmount, onMounted, ref } from 'vue';
import ClockScreen from './ClockScreen.vue';
import ConfirmDialog from './ConfirmDialog.vue';
import Icon from './Icon.vue';
import PlayersView from './PlayersView.vue';
import SettingsView from './SettingsView.vue';
import StructureEditor from './StructureEditor.vue';

type Tab = 'clock' | 'structure' | 'players' | 'settings';
const tabs: { id: Tab; title: string }[] = [
    { id: 'clock', title: 'Clock' },
    { id: 'structure', title: 'Structure' },
    { id: 'players', title: 'Players' },
    { id: 'settings', title: 'Settings' },
];

// The section lives in the URL hash, so a reload stays where you were and Back returns to the clock.
const fromHash = (): Tab => (tabs.find((t) => `#${t.id}` === location.hash)?.id ?? 'clock');
const tab = ref<Tab>(fromHash());
const open = ref(false);
const menu = ref<HTMLElement>();

const select = (id: Tab) => {
    open.value = false;
    if (id === tab.value) return;
    tab.value = id;
    history.pushState(null, '', id === 'clock' ? location.pathname + location.search : `#${id}`);
    window.scrollTo({ top: 0 });
};

const onHash = () => (tab.value = fromHash());
const close = (event: Event) => {
    if (open.value && !menu.value?.contains(event.target as Node)) open.value = false;
};
const escape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') open.value = false;
};
onMounted(() => {
    window.addEventListener('hashchange', onHash);
    document.addEventListener('pointerdown', close);
    window.addEventListener('keydown', escape);
});
onBeforeUnmount(() => {
    window.removeEventListener('hashchange', onHash);
    document.removeEventListener('pointerdown', close);
    window.removeEventListener('keydown', escape);
});
</script>

<template>
    <div class="min-h-dvh">
        <div class="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-linear-to-b from-ochre-50 to-white"></div>

        <header class="mx-auto flex max-w-6xl items-center justify-between gap-x-6 px-4 py-5 sm:px-6 lg:px-8">
            <a href="/" class="font-display text-xl font-semibold text-chip-950" title="Bilby’s website">Bilby</a>

            <nav ref="menu" class="relative" aria-label="Sections">
                <button
                    type="button"
                    class="btn btn-plain btn-icon"
                    aria-label="Menu"
                    title="Menu"
                    aria-haspopup="menu"
                    :aria-expanded="open"
                    @click="open = !open"
                >
                    <Icon name="ellipsis-horizontal" />
                </button>
                <div
                    v-if="open"
                    role="menu"
                    class="absolute top-full right-0 z-30 mt-2 w-48 rounded-xl bg-white p-1 text-sm/6 shadow-lg ring-1 ring-chip-950/10"
                >
                    <button
                        v-for="t in tabs"
                        :key="t.id"
                        type="button"
                        role="menuitem"
                        class="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left hover:bg-chip-50"
                        :class="tab === t.id ? 'font-semibold text-chip-800' : 'text-neutral-700'"
                        :aria-current="tab === t.id ? 'page' : undefined"
                        @click="select(t.id)"
                    >
                        {{ t.title }}
                        <span v-if="tab === t.id" class="size-1.5 rounded-full bg-chip-600"></span>
                    </button>
                </div>
            </nav>
        </header>

        <main>
            <ClockScreen v-if="tab === 'clock'" />
            <StructureEditor v-else-if="tab === 'structure'" />
            <PlayersView v-else-if="tab === 'players'" />
            <SettingsView v-else-if="tab === 'settings'" />
        </main>

        <ConfirmDialog />
    </div>
</template>
