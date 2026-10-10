<script setup lang="ts">
// A ⋯ button with a dropdown, used everywhere a few less common actions are tucked away. The items get `close`,
// so an item can keep the menu open (e.g. to add several minutes in a row).
import { onBeforeUnmount, ref, watch } from 'vue';
import Icon from './Icon.vue';

const props = withDefaults(
    defineProps<{
        label: string;
        icon?: string;
        /** Opens above the button, e.g. near the bottom of the page. */
        up?: boolean;
        align?: 'start' | 'center' | 'end';
        buttonClass?: string;
    }>(),
    { icon: 'ellipsis-horizontal', up: false, align: 'end', buttonClass: '' },
);

const open = ref(false);
const root = ref<HTMLElement>();
const close = () => (open.value = false);

const outside = (event: Event) => {
    if (!root.value?.contains(event.target as Node)) close();
};
const escape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') close();
};

// Listen only while open; there can be a menu on every row of the structure.
watch(open, (isOpen) => {
    if (isOpen) {
        document.addEventListener('pointerdown', outside);
        window.addEventListener('keydown', escape);
    } else {
        document.removeEventListener('pointerdown', outside);
        window.removeEventListener('keydown', escape);
    }
});
onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', outside);
    window.removeEventListener('keydown', escape);
});

const position = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
};
</script>

<template>
    <div ref="root" class="relative">
        <button
            type="button"
            class="btn btn-plain btn-icon"
            :class="buttonClass"
            :aria-label="label"
            :title="label"
            aria-haspopup="menu"
            :aria-expanded="open"
            @click="open = !open"
        >
            <slot name="icon"><Icon :name="props.icon" /></slot>
        </button>
        <div
            v-if="open"
            role="menu"
            class="menu-panel"
            :class="[props.up ? 'bottom-full mb-2' : 'top-full mt-2', position[props.align]]"
        >
            <slot :close="close" />
        </div>
    </div>
</template>
