<script setup lang="ts">
// A sheet, as a native <dialog>: Escape and clicks on the backdrop close it.
import { onMounted, ref, watch } from 'vue';
import Icon from './Icon.vue';

const props = withDefaults(defineProps<{ open: boolean; title: string; wide?: boolean }>(), { wide: false });
const emit = defineEmits<{ close: [] }>();
const dialog = ref<HTMLDialogElement>();

const sync = () => {
    const d = dialog.value;
    if (!d) return;
    if (props.open && !d.open) d.showModal();
    if (!props.open && d.open) d.close();
};
onMounted(sync);
watch(() => props.open, sync);

const backdropClick = (event: MouseEvent) => {
    if (event.target === dialog.value) emit('close');
};
</script>

<template>
    <dialog
        ref="dialog"
        class="m-auto max-h-[min(90dvh,56rem)] w-[calc(100vw-2rem)] overflow-hidden rounded-2xl bg-white p-0 text-neutral-950 shadow-2xl ring-1 ring-chip-950/10"
        :class="wide ? 'max-w-5xl' : 'max-w-lg'"
        @close="emit('close')"
        @cancel.prevent="emit('close')"
        @click="backdropClick"
    >
        <div v-if="open" class="flex max-h-[min(90dvh,56rem)] flex-col">
            <div class="flex items-center justify-between gap-x-4 border-b border-neutral-950/5 px-5 py-4 sm:px-6">
                <h2 class="font-display text-xl font-semibold tracking-tight text-chip-950">{{ title }}</h2>
                <div class="flex items-center gap-x-2">
                    <slot name="actions" />
                    <button type="button" class="btn btn-plain btn-icon" aria-label="Close" @click="emit('close')">
                        <Icon name="x-mark" />
                    </button>
                </div>
            </div>
            <div class="min-h-0 flex-1 overflow-y-auto">
                <slot />
            </div>
        </div>
    </dialog>
</template>
