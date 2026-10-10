<script setup lang="ts">
// Builds a structure from the shape of the game and previews it before use (GeneratorSheet.swift).
import { computed, reactive, watch } from 'vue';
import { TimeFormat, shortText } from '../kit/format';
import { generateStructure } from '../kit/generator';
import { type AnteStyle, isBreak, levelNumber } from '../kit/structure';
import { confirm } from '../confirm';
import * as store from '../store';
import Modal from './Modal.vue';

defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const storageKey = 'bilby.generator';
const defaults = { stack: 10_000, players: 9, hours: 4, levelMinutes: 20, chips: '25, 100, 500, 1000, 5000', breakEvery: 120, antes: 'bigBlind' };
const saved = (() => {
    try {
        return JSON.parse(localStorage.getItem(storageKey) ?? '{}');
    } catch {
        return {};
    }
})();
const form = reactive({ ...defaults, ...saved });
watch(form, () => localStorage.setItem(storageKey, JSON.stringify(form)), { deep: true });

const chips = computed(() =>
    String(form.chips).split(/[^0-9]+/).map((n) => parseInt(n, 10)).filter((n) => Number.isFinite(n) && n > 0));

const structure = computed(() => {
    const minutes = Math.round(Number(form.hours) * 60);
    const players = Math.max(2, Math.round(Number(form.players)) || 2);
    return generateStructure({
        name: `${players} players, ${TimeFormat.duration(minutes)}`,
        startingStack: Math.max(1, Math.round(Number(form.stack)) || 1),
        players,
        targetMinutes: minutes,
        levelMinutes: Number(form.levelMinutes),
        chips: chips.value,
        breakEveryMinutes: Number(form.breakEvery),
        anteStyle: form.antes === 'none' ? null : (form.antes as AnteStyle),
    });
});

const use = async () => {
    if (store.tournament.value.clock.hasStarted) {
        const ok = await confirm({
            title: 'Replace the structure in play?',
            message: 'The clock goes back to level 1.',
            action: 'Use structure',
            destructive: true,
        });
        if (!ok) return;
    }
    store.use(structure.value);
    emit('close');
};
</script>

<template>
    <Modal :open="open" title="Generate a structure" wide @close="emit('close')">
        <template #actions>
            <button type="button" class="btn btn-primary" :disabled="chips.length === 0" @click="use">Use structure</button>
        </template>

        <div class="grid md:grid-cols-[20rem_minmax(0,1fr)]">
            <form class="space-y-5 border-neutral-950/5 p-5 sm:p-6 md:border-r" @submit.prevent>
                <p class="text-sm/6 text-pretty text-neutral-600">
                    Tell Bilby your starting stack, the players, your chips and how long the game should last. It suggests blinds your chips can pay.
                </p>
                <div>
                    <label class="label" for="gen-stack">Starting stack</label>
                    <input id="gen-stack" v-model.number="form.stack" inputmode="numeric" class="field mt-1">
                </div>
                <div>
                    <label class="label" for="gen-players">Players</label>
                    <input id="gen-players" v-model.number="form.players" type="number" min="2" max="500" class="field mt-1">
                </div>
                <div>
                    <label class="label" for="gen-chips">Chips</label>
                    <input id="gen-chips" v-model="form.chips" placeholder="25, 100, 500" class="field mt-1">
                    <p v-if="chips.length === 0" class="mt-1 text-xs/5 text-red-700">Enter the chip values you play with.</p>
                </div>
                <div>
                    <label class="label" for="gen-hours">Ends after about</label>
                    <select id="gen-hours" v-model.number="form.hours" class="field mt-1">
                        <option v-for="h in [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8, 9, 10, 11, 12]" :key="h" :value="h">
                            {{ TimeFormat.duration(h * 60) }}
                        </option>
                    </select>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="label" for="gen-levels">Levels</label>
                        <select id="gen-levels" v-model.number="form.levelMinutes" class="field mt-1">
                            <option v-for="m in [10, 12, 15, 20, 25, 30, 40, 45, 60]" :key="m" :value="m">{{ m }} min</option>
                        </select>
                    </div>
                    <div>
                        <label class="label" for="gen-break">Break</label>
                        <select id="gen-break" v-model.number="form.breakEvery" class="field mt-1">
                            <option :value="0">None</option>
                            <option v-for="m in [60, 90, 120, 180]" :key="m" :value="m">Every {{ TimeFormat.duration(m) }}</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label class="label" for="gen-antes">Antes</label>
                    <select id="gen-antes" v-model="form.antes" class="field mt-1">
                        <option value="bigBlind">Big blind ante</option>
                        <option value="everyone">Everyone pays</option>
                        <option value="none">None</option>
                    </select>
                </div>
            </form>

            <div class="max-md:border-t max-md:border-neutral-950/5">
                <p class="px-5 pt-5 text-sm/6 font-semibold text-chip-950 sm:px-6">Preview</p>
                <ol role="list" class="divide-y divide-neutral-950/5 px-5 pb-4 text-sm/6 tabular-nums sm:px-6">
                    <li v-for="(round, index) in structure.rounds" :key="round.id" class="flex items-baseline gap-x-4 py-1.5">
                        <span class="w-16 shrink-0" :class="isBreak(round) ? 'text-neutral-500' : 'font-medium text-chip-950'">
                            {{ levelNumber(structure, index) ? `Level ${levelNumber(structure, index)}` : 'Break' }}
                        </span>
                        <span class="min-w-0 flex-1 truncate" :class="isBreak(round) ? 'text-neutral-500' : ''">
                            {{ isBreak(round) ? round.note : shortText(round) }}
                        </span>
                        <span class="text-neutral-500">{{ round.minutes }} min</span>
                    </li>
                </ol>
            </div>
        </div>
    </Modal>
</template>
