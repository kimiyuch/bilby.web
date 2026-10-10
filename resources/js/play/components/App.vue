<script setup lang="ts">
// The main window: the website's header, with links to the app's four sections (Clock, Structure, Players, Settings).
import { onBeforeUnmount, onMounted, ref } from 'vue';
import ClockScreen from './ClockScreen.vue';
import ConfirmDialog from './ConfirmDialog.vue';
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

const select = (id: Tab) => {
    if (id === tab.value) return;
    tab.value = id;
    history.pushState(null, '', id === 'clock' ? location.pathname + location.search : `#${id}`);
    window.scrollTo({ top: 0 });
};

const onHash = () => (tab.value = fromHash());
onMounted(() => window.addEventListener('hashchange', onHash));
onBeforeUnmount(() => window.removeEventListener('hashchange', onHash));
</script>

<template>
    <div class="min-h-dvh">
        <!-- One even, warm background, the pale ochre of the website. -->
        <div class="fixed inset-0 -z-10 bg-ochre-50"></div>

        <!-- Same size and padding as the website header (site-header.blade.php), so nothing moves between them. -->
        <header class="mx-auto flex max-w-6xl items-center justify-between gap-x-3 px-6 py-5 sm:gap-x-6 lg:px-8">
            <a href="/" aria-label="Homepage" class="font-display text-xl font-semibold text-chip-950">Bilby</a>
            <nav class="-mr-1.5 flex items-center gap-x-0.5 overflow-x-auto sm:-mr-2 sm:gap-x-4" aria-label="Sections">
                <button
                    v-for="t in tabs"
                    :key="t.id"
                    type="button"
                    class="shrink-0 rounded-md px-1.5 text-sm/6 font-medium sm:px-2"
                    :class="tab === t.id ? 'text-chip-800' : 'text-neutral-500 hover:text-chip-700'"
                    :aria-current="tab === t.id ? 'page' : undefined"
                    @click="select(t.id)"
                >
                    <span :class="tab === t.id ? 'underline decoration-ochre-400 decoration-2 underline-offset-8' : ''">{{ t.title }}</span>
                </button>
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
