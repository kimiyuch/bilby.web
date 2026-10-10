<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { answer, pending } from '../confirm';

const dialog = ref<HTMLDialogElement>();

const sync = () => {
    const d = dialog.value;
    if (!d) return;
    if (pending.value && !d.open) d.showModal();
    if (!pending.value && d.open) d.close();
};
onMounted(sync);
watch(pending, sync);
</script>

<template>
    <dialog
        ref="dialog"
        class="m-auto w-[calc(100vw-2rem)] max-w-sm rounded-2xl bg-white p-6 text-neutral-950 shadow-2xl ring-1 ring-chip-950/10"
        @cancel.prevent="answer(false)"
    >
        <template v-if="pending">
            <h2 class="font-display text-lg font-semibold tracking-tight text-chip-950">{{ pending.title }}</h2>
            <p class="mt-2 text-sm/6 text-pretty text-neutral-600">{{ pending.message }}</p>
            <div class="mt-6 flex justify-end gap-x-3">
                <button type="button" class="btn" @click="answer(false)">Cancel</button>
                <button type="button" class="btn" :class="pending.destructive ? 'btn-danger' : 'btn-primary'" autofocus @click="answer(true)">
                    {{ pending.action }}
                </button>
            </div>
        </template>
    </dialog>
</template>
