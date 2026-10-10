<script setup lang="ts">
// The main window: the website's header with the app's four tabs (Clock, Structure, Players, Settings).
import { onBeforeUnmount, onMounted, ref } from 'vue';
import BigScreen from './BigScreen.vue';
import ClockScreen from './ClockScreen.vue';
import ConfirmDialog from './ConfirmDialog.vue';
import Icon from './Icon.vue';
import PlayersView from './PlayersView.vue';
import SettingsView from './SettingsView.vue';
import StructureEditor from './StructureEditor.vue';

defineProps<{ screen: boolean }>();

type Tab = 'clock' | 'structure' | 'players' | 'settings';
const tabs: { id: Tab; title: string }[] = [
    { id: 'clock', title: 'Clock' },
    { id: 'structure', title: 'Structure' },
    { id: 'players', title: 'Players' },
    { id: 'settings', title: 'Settings' },
];

// The tab lives in the URL hash, so a reload stays where you were.
const fromHash = (): Tab => (tabs.find((t) => `#${t.id}` === location.hash)?.id ?? 'clock');
const tab = ref<Tab>(fromHash());
const select = (id: Tab) => {
    tab.value = id;
    history.replaceState(null, '', id === 'clock' ? location.pathname + location.search : `#${id}`);
    window.scrollTo({ top: 0 });
};
const onHash = () => (tab.value = fromHash());
onMounted(() => window.addEventListener('hashchange', onHash));
onBeforeUnmount(() => window.removeEventListener('hashchange', onHash));

const openBigScreen = () => {
    window.open('/play?screen', 'bilby-big-screen', 'popup,width=960,height=600');
};
</script>

<template>
    <BigScreen v-if="screen" />

    <div v-else class="min-h-dvh">
        <div class="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-linear-to-b from-ochre-50 to-white"></div>

        <header class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-5 sm:px-6 lg:px-8">
            <a href="/" class="flex items-center gap-x-2.5 font-display text-xl font-semibold text-chip-950" title="Bilby’s website">
                <img src="/images/favicon.png?v=2" alt="" class="size-8">
                Bilby
            </a>

            <nav class="flex items-center gap-x-1 rounded-full bg-white/70 p-1 ring-1 ring-chip-950/10 max-sm:order-last max-sm:w-full" aria-label="Sections">
                <button
                    v-for="t in tabs"
                    :key="t.id"
                    type="button"
                    class="rounded-full px-3.5 py-1.5 text-sm/6 font-medium max-sm:flex-1"
                    :class="tab === t.id ? 'bg-chip-600 text-white shadow-sm' : 'text-neutral-700 hover:text-chip-700'"
                    :aria-current="tab === t.id ? 'page' : undefined"
                    @click="select(t.id)"
                >
                    {{ t.title }}
                </button>
            </nav>

            <button type="button" class="btn" title="Show the clock on its own, for a TV or projector" @click="openBigScreen">
                <Icon name="tv" />
                <span class="max-sm:sr-only">Big screen</span>
            </button>
        </header>

        <main>
            <ClockScreen v-if="tab === 'clock'" @big-screen="openBigScreen" />
            <StructureEditor v-else-if="tab === 'structure'" />
            <PlayersView v-else-if="tab === 'players'" />
            <SettingsView v-else-if="tab === 'settings'" />
        </main>

        <ConfirmDialog />
    </div>
</template>
