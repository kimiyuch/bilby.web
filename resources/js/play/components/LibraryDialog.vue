<script setup lang="ts">
// Pick a structure to play: the built-in presets and your own (StructureLibrary.swift).
import { blindsText } from '../kit/format';
import { allPresets } from '../kit/presets';
import { type Structure, isBreak, levelCount } from '../kit/structure';
import { confirm } from '../confirm';
import * as store from '../store';
import Icon from './Icon.vue';
import Modal from './Modal.vue';

defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const presets = allPresets();

const details = (s: Structure) => {
    const first = s.rounds.find((r) => !isBreak(r));
    return `${levelCount(s)} levels of ${first?.minutes ?? 0} min · starts ${first ? blindsText(first) : '–'}`;
};

// Your own structures keep their identity, so saving again updates them; presets get a fresh copy.
const use = async (s: Structure) => {
    if (store.tournament.value.clock.hasStarted) {
        const ok = await confirm({
            title: 'Replace the structure in play?',
            message: 'The clock goes back to level 1.',
            action: `Use ${s.name}`,
            destructive: true,
        });
        if (!ok) return;
    }
    store.use(s);
    emit('close');
};

const remove = async (s: Structure) => {
    const ok = await confirm({ title: `Delete ${s.name}?`, message: 'It’s removed from My Structures.', action: 'Delete', destructive: true });
    if (ok) store.removeFromLibrary(s);
};
</script>

<template>
    <Modal :open="open" title="Structures" @close="emit('close')">
        <section class="px-5 pt-4 sm:px-6">
            <h3 class="eyebrow">Presets</h3>
            <ul role="list" class="divide-y divide-neutral-950/5">
                <li v-for="s in presets" :key="s.name" class="flex items-center gap-x-4 py-3">
                    <div class="min-w-0 flex-1">
                        <p class="text-sm/6 font-medium text-chip-950">{{ s.name }}</p>
                        <p class="text-xs/5 text-neutral-500 tabular-nums">{{ details(s) }}</p>
                    </div>
                    <button type="button" class="btn" @click="use(s)">Use</button>
                </li>
            </ul>
        </section>
        <section class="border-t border-neutral-950/5 px-5 pt-4 pb-4 sm:px-6">
            <h3 class="eyebrow">My Structures</h3>
            <p v-if="store.library.value.length === 0" class="py-3 text-sm/6 text-neutral-500">
                Structures you save or import show up here.
            </p>
            <ul role="list" class="divide-y divide-neutral-950/5">
                <li v-for="s in store.library.value" :key="s.id" class="flex items-center gap-x-2 py-3">
                    <div class="min-w-0 flex-1">
                        <p class="truncate text-sm/6 font-medium text-chip-950">{{ s.name }}</p>
                        <p class="text-xs/5 text-neutral-500 tabular-nums">{{ details(s) }}</p>
                    </div>
                    <button type="button" class="btn btn-plain btn-icon text-neutral-500" :aria-label="`Delete ${s.name}`" @click="remove(s)">
                        <Icon name="trash" />
                    </button>
                    <button type="button" class="btn" @click="use(s)">Use</button>
                </li>
            </ul>
        </section>
    </Modal>
</template>
