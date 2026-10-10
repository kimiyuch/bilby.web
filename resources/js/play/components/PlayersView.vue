<script setup lang="ts">
// Buy-ins, the counters kept during the game, the prize pool and payouts (PlayersView.swift).
import { computed, ref } from 'vue';
import { chips, money, place } from '../kit/format';
import * as pp from '../kit/prizePool';
import { confirm } from '../confirm';
import * as store from '../store';
import Icon from './Icon.vue';

const pool = computed(() => store.tournament.value.prizePool);
const update = store.updatePrizePool;
const editingPayouts = ref(false);

const counters = computed(() => [
    { title: 'Entries', value: pool.value.entries, total: null, add: pp.addEntry, remove: pp.removeEntry, removeLabel: 'Remove' },
    { title: 'Rebuys', value: pool.value.rebuys, total: null, add: pp.addRebuy, remove: pp.removeRebuy, removeLabel: 'Remove' },
    { title: 'Add-ons', value: pool.value.addOns, total: null, add: pp.addAddOn, remove: pp.removeAddOn, removeLabel: 'Remove' },
    { title: 'Players left', value: pool.value.playersLeft, total: pool.value.entries, add: pp.reinstate, remove: pp.eliminate, removeLabel: 'Knock out' },
]);

const amounts = computed(() => pp.payouts(pool.value));
const percentages = computed(() => pp.payoutPercentages(pool.value));
const percentSum = computed(() => percentages.value.reduce((a, b) => a + b, 0));

const currencies = computed(() => {
    const common = ['CHF', 'EUR', 'USD', 'GBP', 'AUD', 'CAD', 'JPY', 'SEK', 'NOK', 'DKK'];
    return common.includes(pool.value.currency) ? common : [pool.value.currency, ...common];
});

type MoneyField = 'buyIn' | 'rebuy' | 'addOn' | 'fee';
type StackField = 'startingStack' | 'rebuyStack' | 'addOnStack';
const buyIns: { title: string; amount: MoneyField; stack: StackField | null }[] = [
    { title: 'Buy-in', amount: 'buyIn', stack: 'startingStack' },
    { title: 'Rebuy', amount: 'rebuy', stack: 'rebuyStack' },
    { title: 'Add-on', amount: 'addOn', stack: 'addOnStack' },
    { title: 'Fee per entry', amount: 'fee', stack: null },
];

const setNumber = (field: MoneyField | StackField, event: Event, whole: boolean) => {
    const input = event.target as HTMLInputElement;
    const value = Number(input.value.replace(',', '.').replace(/[^0-9.]/g, ''));
    if (input.value.trim() === '' || !Number.isFinite(value) || value < 0) {
        input.value = String(pool.value[field]);
        return;
    }
    update((p) => ({ ...p, [field]: whole ? Math.round(value) : Math.round(value * 100) / 100 }));
};

const setPercent = (i: number, event: Event) => {
    const value = Number((event.target as HTMLInputElement).value.replace(',', '.'));
    if (!Number.isFinite(value)) return;
    update((p) => {
        const custom = [...pp.payoutPercentages(p)];
        if (i >= custom.length) return p;
        custom[i] = Math.max(0, value);
        return { ...p, customPayouts: custom };
    });
};

const addPlace = () =>
    update((p) => {
        const custom = [...pp.payoutPercentages(p)];
        const last = custom[custom.length - 1];
        custom.push(last === undefined ? 10 : Math.max(1, Math.round(last / 2)));
        return { ...p, customPayouts: custom };
    });

const removePlace = (i: number) =>
    update((p) => {
        const custom = [...pp.payoutPercentages(p)];
        if (custom.length <= 1) return p;
        custom.splice(i, 1);
        return { ...p, customPayouts: custom };
    });

const newTournament = async () => {
    const ok = await confirm({
        title: 'Start a new tournament?',
        message: 'The clock goes back to level 1 and all counters to zero. The structure and buy-ins stay.',
        action: 'New tournament',
        destructive: true,
    });
    if (ok) store.newTournament();
};
</script>

<template>
    <div class="mx-auto max-w-6xl px-6 pb-16 lg:px-8">
        <div class="flex flex-wrap items-end justify-between gap-4">
            <div>
                <p class="eyebrow">Players and prize pool</p>
                <h1 class="mt-1 font-display text-3xl font-semibold tracking-tight text-chip-950">Who’s in, and what’s at stake</h1>
            </div>
            <button type="button" class="btn py-2 pr-3 pl-2" title="Reset the clock and the counters" @click="newTournament">
                <Icon name="arrow-path" /> New tournament
            </button>
        </div>

        <div class="mt-10 grid gap-x-16 gap-y-10 lg:grid-cols-2">
            <div class="space-y-10">
                <section>
                    <h2 class="section-title pb-2">In the game</h2>
                    <ul role="list" class="divide-y divide-neutral-950/5 border-t border-neutral-950/10">
                        <li v-for="c in counters" :key="c.title" class="row">
                            <span class="text-sm/6 font-medium text-neutral-700">{{ c.title }}</span>
                            <div class="flex items-center gap-x-3">
                                <button type="button" class="btn btn-icon" :aria-label="`${c.removeLabel}: ${c.title}`" :title="c.removeLabel" :disabled="c.value === 0" @click="update(c.remove)">
                                    <Icon name="minus" />
                                </button>
                                <span class="min-w-20 text-center font-display text-2xl font-semibold text-chip-950 tabular-nums">
                                    {{ c.value }}<span v-if="c.total !== null" class="text-neutral-400"> / {{ c.total }}</span>
                                </span>
                                <button type="button" class="btn btn-icon" :aria-label="`Add: ${c.title}`" title="Add" :disabled="c.total !== null && c.value >= c.total" @click="update(c.add)">
                                    <Icon name="plus" />
                                </button>
                            </div>
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 class="section-title pb-2">Buy-ins</h2>
                    <div class="divide-y divide-neutral-950/5 border-t border-neutral-950/10">
                        <div class="row">
                            <label for="currency" class="text-sm/6 font-medium text-neutral-700">Currency</label>
                            <select id="currency" class="field w-28" :value="pool.currency" @change="update((p) => ({ ...p, currency: ($event.target as HTMLSelectElement).value }))">
                                <option v-for="c in currencies" :key="c" :value="c">{{ c }}</option>
                            </select>
                        </div>
                        <div v-for="b in buyIns" :key="b.amount" class="row">
                            <span class="text-sm/6 font-medium text-neutral-700">{{ b.title }}</span>
                            <div class="flex items-center gap-x-2">
                                <input
                                    :value="pool[b.amount]"
                                    inputmode="decimal"
                                    class="field w-24 text-right"
                                    :aria-label="`${b.title} (${pool.currency})`"
                                    @change="setNumber(b.amount, $event, false)"
                                >
                                <template v-if="b.stack">
                                    <input
                                        :value="pool[b.stack]"
                                        inputmode="numeric"
                                        class="field w-24 text-right"
                                        :aria-label="`${b.title} chips`"
                                        @change="setNumber(b.stack, $event, true)"
                                    >
                                    <span class="w-9 text-sm/6 text-neutral-500">chips</span>
                                </template>
                                <span v-else class="w-[8.75rem]"></span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <div class="space-y-10">
                <section>
                    <div class="flex items-baseline justify-between pb-2">
                        <h2 class="section-title">Prize pool</h2>
                        <span class="font-display text-3xl font-semibold tracking-tight text-chip-950 tabular-nums">{{ money(pp.total(pool), pool.currency) }}</span>
                    </div>
                    <dl class="divide-y divide-neutral-950/5 border-t border-neutral-950/10 text-sm/6 tabular-nums">
                        <div class="row">
                            <dt class="text-neutral-600">Chips in play</dt>
                            <dd class="font-medium">{{ chips(pp.chipsInPlay(pool)) }}</dd>
                        </div>
                        <div class="row">
                            <dt class="text-neutral-600">Average stack</dt>
                            <dd class="font-medium">{{ pp.averageStack(pool) === null ? '–' : chips(pp.averageStack(pool)!) }}</dd>
                        </div>
                        <div v-if="pool.fee > 0" class="row">
                            <dt class="text-neutral-600">Fees collected</dt>
                            <dd class="font-medium">{{ money(pp.fees(pool), pool.currency) }}</dd>
                        </div>
                    </dl>
                </section>

                <section>
                    <div class="flex items-center justify-between pb-2">
                        <h2 class="section-title">Payouts</h2>
                        <button type="button" class="btn btn-plain py-1" @click="editingPayouts = !editingPayouts">{{ editingPayouts ? 'Done' : 'Edit' }}</button>
                    </div>
                    <ul role="list" class="divide-y divide-neutral-950/5 border-t border-neutral-950/10 text-sm/6 tabular-nums">
                        <li v-for="(pct, i) in percentages" :key="i" class="row">
                            <span class="w-10 font-medium text-chip-950">{{ place(i + 1) }}</span>
                            <span v-if="!editingPayouts" class="text-neutral-500">{{ pct }} %</span>
                            <span v-else class="flex items-center gap-x-1.5">
                                <input :value="pct" inputmode="decimal" class="field w-20 text-right" :aria-label="`${place(i + 1)} place percent`" @change="setPercent(i, $event)">
                                <span class="text-neutral-500">%</span>
                            </span>
                            <span class="ml-auto font-medium">{{ money(amounts[i] ?? 0, pool.currency) }}</span>
                            <button
                                v-if="editingPayouts"
                                type="button"
                                class="btn btn-plain btn-icon text-neutral-500"
                                :aria-label="`Remove ${place(i + 1)} place`"
                                :disabled="percentages.length === 1"
                                @click="removePlace(i)"
                            >
                                <Icon name="minus" />
                            </button>
                        </li>
                    </ul>
                    <div v-if="editingPayouts" class="space-y-2 border-t border-neutral-950/5 py-3">
                        <div class="flex justify-between gap-2">
                            <button type="button" class="btn py-2 pr-3 pl-2" @click="addPlace"><Icon name="plus" /> Add place</button>
                            <button type="button" class="btn btn-plain" :disabled="pool.customPayouts === null" @click="update((p) => ({ ...p, customPayouts: null }))">Use the table</button>
                        </div>
                        <p v-if="Math.abs(percentSum - 100) > 0.001" class="text-xs/5 text-neutral-500">
                            These add up to {{ percentSum }} %, so Bilby scales them to the whole pool.
                        </p>
                    </div>
                    <p v-else class="border-t border-neutral-950/5 py-3 text-xs/5 text-neutral-500">
                        {{ pool.customPayouts === null
                            ? `From the payout table for ${pool.entries} ${pool.entries === 1 ? 'entry' : 'entries'}.`
                            : 'Custom payouts for this tournament.' }}
                    </p>
                </section>
            </div>
        </div>
    </div>
</template>
