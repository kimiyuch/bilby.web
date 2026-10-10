<script setup lang="ts">
// Edits the structure in play (StructureEditor.swift). Changes apply immediately; the clock stays on its round.
import { computed, onBeforeUnmount, ref } from 'vue';
import { TimeFormat } from '../kit/format';
import {
    type AnteStyle, type Round, type Structure, StructureFileError, exportStructure, importStructure, isBreak, levelCount,
    levelNumber, pause, suggestedLevel, totalDuration,
} from '../kit/structure';
import * as store from '../store';
import GeneratorDialog from './GeneratorDialog.vue';
import Icon from './Icon.vue';
import LibraryDialog from './LibraryDialog.vue';
import Menu from './Menu.vue';

const structure = computed(() => store.tournament.value.structure);
const current = computed(() => (store.tournament.value.clock.hasStarted ? store.snapshot(store.now.value).roundIndex : -1));
const summary = computed(() => `${levelCount(structure.value)} levels · ${TimeFormat.duration(Math.floor(totalDuration(structure.value) / 60))}`);

const showGenerator = ref(false);
const showLibrary = ref(false);
const message = ref<{ text: string; error?: boolean } | null>(null);
let messageTimer: number | undefined;
const say = (text: string, error = false) => {
    message.value = { text, error };
    window.clearTimeout(messageTimer);
    messageTimer = window.setTimeout(() => (message.value = null), error ? 6000 : 2500);
};

// MARK: Editing

const edit = (body: (s: Structure) => void) => {
    const s = structuredClone(structure.value);
    body(s);
    store.setStructure(s);
};

const setName = (event: Event) => {
    const name = (event.target as HTMLInputElement).value.trim();
    edit((s) => (s.name = name || 'Untitled structure'));
};

/** Whole numbers only; empty or invalid input goes back to what it was. */
const setNumber = (round: Round, field: 'smallBlind' | 'bigBlind' | 'ante' | 'minutes', event: Event) => {
    const input = event.target as HTMLInputElement;
    const value = Math.round(Number(input.value));
    const min = field === 'minutes' ? 1 : 0;
    if (input.value.trim() === '' || !Number.isFinite(value) || value < min) {
        input.value = String(round[field]);
        return;
    }
    edit((s) => {
        const r = s.rounds.find((x) => x.id === round.id);
        if (r) r[field] = Math.min(value, field === 'minutes' ? 600 : 1e12);
    });
};

const setAnteStyle = (round: Round, style: AnteStyle) =>
    edit((s) => {
        const r = s.rounds.find((x) => x.id === round.id);
        if (r) r.anteStyle = style;
    });

const setNote = (round: Round, event: Event) =>
    edit((s) => {
        const r = s.rounds.find((x) => x.id === round.id);
        if (r) r.note = (event.target as HTMLInputElement).value;
    });

const insert = (kind: 'level' | 'break', index: number) =>
    edit((s) => {
        const previous = s.rounds.slice(0, index).reverse().find((r) => !isBreak(r));
        s.rounds.splice(index, 0, kind === 'break' ? pause(10) : suggestedLevel(s, previous));
    });

const remove = (index: number) =>
    edit((s) => {
        if (s.rounds.length > 1) s.rounds.splice(index, 1);
    });

const move = (from: number, to: number) =>
    edit((s) => {
        if (to < 0 || to >= s.rounds.length) return;
        const [round] = s.rounds.splice(from, 1);
        s.rounds.splice(to, 0, round);
    });

// MARK: Row menu

onBeforeUnmount(() => window.clearTimeout(messageTimer));
const playFrom = (index: number) => store.jump(index);
/** Runs a menu item, then closes the menu. */
const run = (action: () => unknown, close: () => void) => {
    close();
    action();
};

// MARK: Dragging rows by their handle

const dragging = ref<number | null>(null);
const dropTarget = ref<number | null>(null);
const armed = ref<string | null>(null);
const dragStart = (index: number, event: DragEvent) => {
    dragging.value = index;
    event.dataTransfer?.setData('text/plain', String(index));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
};
const dragOver = (index: number, event: DragEvent) => {
    if (dragging.value === null) return;
    event.preventDefault();
    dropTarget.value = index;
};
const drop = (index: number) => {
    if (dragging.value !== null && dragging.value !== index) move(dragging.value, index);
    dragEnd();
};
const dragEnd = () => {
    dragging.value = null;
    dropTarget.value = null;
    armed.value = null;
};

// MARK: Files

const fileInput = ref<HTMLInputElement>();

const importFile = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
        const imported = importStructure(await file.text());
        store.saveToLibrary(imported);
        showLibrary.value = true;
    } catch (error) {
        const e = error instanceof StructureFileError ? error.error : null;
        say(
            e?.kind === 'unsupportedVersion' ? 'This structure was made by a newer version of Bilby.'
                : e?.kind === 'invalidLevel' ? `Round ${e.index} in this file doesn’t make sense.`
                    : 'This file isn’t a Bilby structure.',
            true,
        );
    }
};

const exportFile = () => {
    const blob = new Blob([exportStructure(structure.value)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${structure.value.name.replace(/[\\/:*?"<>|]+/g, '-') || 'Structure'}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
};

const saveToLibrary = () => {
    store.saveToLibrary(structure.value);
    say('Saved to My Structures.');
};
</script>

<template>
    <div class="mx-auto max-w-6xl px-6 pb-16 lg:px-8">
        <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <div class="min-w-0 flex-1 basis-80">
                <p class="eyebrow">Blind structure</p>
                <input
                    :key="structure.id + structure.name"
                    :value="structure.name"
                    aria-label="Name"
                    class="mt-1 w-full rounded-md bg-transparent px-1 -mx-1 font-display text-3xl font-semibold tracking-tight text-chip-950 outline-none hover:bg-white/60 focus:bg-white focus:ring-2 focus:ring-ochre-500"
                    @change="setName"
                    @keydown.enter="($event.target as HTMLInputElement).blur()"
                >
                <p class="mt-1 text-sm/6 text-neutral-500">{{ summary }} · Changes apply straight away; the clock stays on its level.</p>
            </div>
            <div class="flex items-center gap-2">
                <button type="button" class="btn" @click="showLibrary = true"><Icon name="book-open" /> Structures</button>
                <button type="button" class="btn" @click="showGenerator = true"><Icon name="sparkles" /> Generate</button>
                <Menu label="More">
                    <template #default="{ close }">
                        <button type="button" role="menuitem" class="menu-item" @click="run(saveToLibrary, close)">Save to My Structures</button>
                        <hr class="menu-separator">
                        <button type="button" role="menuitem" class="menu-item" @click="run(() => fileInput?.click(), close)">Import a file…</button>
                        <button type="button" role="menuitem" class="menu-item" @click="run(exportFile, close)">Export as a file</button>
                    </template>
                </Menu>
                <input ref="fileInput" type="file" accept=".json,application/json" class="hidden" @change="importFile">
            </div>
        </div>

        <p
            v-if="message"
            class="mt-4 rounded-lg px-4 py-2 text-sm/6 font-medium"
            :class="message.error ? 'bg-red-50 text-red-800' : 'bg-chip-50 text-chip-800'"
            role="status"
        >
            {{ message.text }}
        </p>

        <div class="mt-8 border-y border-neutral-950/10">
            <!-- Column titles, on wide screens -->
            <div class="hidden grid-cols-[1.5rem_6.5rem_repeat(3,minmax(0,1fr))_8.5rem_5.5rem_2.25rem] items-center gap-x-3 border-b border-neutral-950/5 py-2.5 text-xs/5 font-medium text-neutral-500 md:grid">
                <span></span>
                <span></span>
                <span class="text-right">Small blind</span>
                <span class="text-right">Big blind</span>
                <span class="text-right">Ante</span>
                <span>Paid by</span>
                <span class="text-right">Minutes</span>
                <span></span>
            </div>

            <ol role="list" class="divide-y divide-neutral-950/5">
                <li
                    v-for="(round, index) in structure.rounds"
                    :key="round.id"
                    class="relative grid grid-cols-[1.5rem_minmax(0,1fr)_5.5rem_2.25rem] items-center gap-x-3 gap-y-2 py-2.5 md:grid-cols-[1.5rem_6.5rem_repeat(3,minmax(0,1fr))_8.5rem_5.5rem_2.25rem]"
                    :class="{
                        '-mx-3 bg-ochre-50 px-3 sm:rounded-lg': index === current,
                        'opacity-40': dragging === index,
                        'shadow-[inset_0_2px_0_var(--color-chip-500)]': dropTarget === index && dragging !== null && dragging > index,
                        'shadow-[inset_0_-2px_0_var(--color-chip-500)]': dropTarget === index && dragging !== null && dragging < index,
                    }"
                    :draggable="armed === round.id"
                    @dragstart="dragStart(index, $event)"
                    @dragover="dragOver(index, $event)"
                    @drop.prevent="drop(index)"
                    @dragend="dragEnd"
                >
                    <span
                        class="flex cursor-grab items-center justify-center text-neutral-300 hover:text-neutral-500 max-md:row-span-2 max-md:self-start max-md:pt-1.5"
                        title="Drag to move"
                        @pointerdown="armed = round.id"
                        @pointerup="armed = null"
                    >
                        <Icon name="bars-2" class="size-4" />
                    </span>

                    <span class="flex items-center gap-x-1.5 text-sm/6 font-medium" :class="isBreak(round) ? 'text-neutral-500' : 'text-chip-950'">
                        <Icon name="play" class="size-3 shrink-0 text-ochre-500" :class="index === current ? '' : 'invisible'" />
                        {{ levelNumber(structure, index) ? `Level ${levelNumber(structure, index)}` : 'Break' }}
                    </span>

                    <template v-if="isBreak(round)">
                        <input
                            :value="round.note"
                            placeholder="Note, e.g. color up the 25s"
                            aria-label="Note"
                            class="field max-md:col-span-3 max-md:col-start-2 max-md:row-start-2 md:col-span-4"
                            @change="setNote(round, $event)"
                        >
                    </template>
                    <template v-else>
                        <div class="grid grid-cols-3 gap-x-2 max-md:col-span-3 max-md:col-start-2 max-md:row-start-2 md:contents">
                            <label class="block">
                                <span class="mb-0.5 block text-xs/5 text-neutral-500 md:sr-only">Small blind</span>
                                <input :value="round.smallBlind" inputmode="numeric" class="field text-right" @change="setNumber(round, 'smallBlind', $event)">
                            </label>
                            <label class="block">
                                <span class="mb-0.5 block text-xs/5 text-neutral-500 md:sr-only">Big blind</span>
                                <input :value="round.bigBlind" inputmode="numeric" class="field text-right" @change="setNumber(round, 'bigBlind', $event)">
                            </label>
                            <label class="block">
                                <span class="mb-0.5 block text-xs/5 text-neutral-500 md:sr-only">Ante</span>
                                <input :value="round.ante" inputmode="numeric" class="field text-right" @change="setNumber(round, 'ante', $event)">
                            </label>
                        </div>
                        <select
                            :value="round.anteStyle"
                            :disabled="round.ante === 0"
                            aria-label="Ante paid by"
                            class="field max-md:hidden"
                            @change="setAnteStyle(round, ($event.target as HTMLSelectElement).value as AnteStyle)"
                        >
                            <option value="bigBlind">Big blind</option>
                            <option value="everyone">Everyone</option>
                        </select>
                    </template>

                    <label class="flex items-center gap-x-1.5 max-md:row-start-1 max-md:col-start-3">
                        <input :value="round.minutes" inputmode="numeric" aria-label="Minutes" class="field text-right" @change="setNumber(round, 'minutes', $event)">
                        <span class="text-xs/5 text-neutral-500 md:hidden">min</span>
                    </label>

                    <Menu label="More" class="max-md:col-start-4 max-md:row-start-1">
                        <template #default="{ close }">
                            <button type="button" role="menuitem" class="menu-item" @click="run(() => playFrom(index), close)">Play from here</button>
                            <hr class="menu-separator">
                            <button type="button" role="menuitem" class="menu-item" @click="run(() => insert('level', index), close)">Insert level above</button>
                            <button type="button" role="menuitem" class="menu-item" @click="run(() => insert('break', index), close)">Insert break above</button>
                            <button type="button" role="menuitem" class="menu-item" :disabled="index === 0" @click="run(() => move(index, index - 1), close)">Move up</button>
                            <button type="button" role="menuitem" class="menu-item" :disabled="index === structure.rounds.length - 1" @click="run(() => move(index, index + 1), close)">Move down</button>
                            <template v-if="!isBreak(round)">
                                <hr class="menu-separator md:hidden">
                                <button
                                    type="button"
                                    role="menuitem"
                                    class="menu-item md:hidden"
                                    :disabled="round.ante === 0"
                                    @click="run(() => setAnteStyle(round, round.anteStyle === 'bigBlind' ? 'everyone' : 'bigBlind'), close)"
                                >
                                    {{ round.anteStyle === 'bigBlind' ? 'Ante: everyone pays' : 'Ante: big blind pays' }}
                                </button>
                            </template>
                            <hr class="menu-separator">
                            <button type="button" role="menuitem" class="menu-item text-red-700" :disabled="structure.rounds.length === 1" @click="run(() => remove(index), close)">Delete</button>
                        </template>
                    </Menu>
                </li>
            </ol>

            <div class="flex flex-wrap items-center gap-2 border-t border-neutral-950/5 py-3">
                <button type="button" class="btn" @click="insert('level', structure.rounds.length)"><Icon name="plus" /> Add level</button>
                <button type="button" class="btn btn-plain" @click="insert('break', structure.rounds.length)"><Icon name="plus" /> Add break</button>
                <span class="ml-auto text-sm/6 text-neutral-500 tabular-nums">{{ summary }}</span>
            </div>
        </div>

        <GeneratorDialog :open="showGenerator" @close="showGenerator = false" />
        <LibraryDialog :open="showLibrary" @close="showLibrary = false" />
    </div>
</template>

