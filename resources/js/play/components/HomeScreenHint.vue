<script setup lang="ts">
// On an iPhone or iPad the browser's bars stay around the clock, even in full screen; from the Home Screen they
// don't. Says so once, until it's dismissed.
import { ref } from 'vue';
import { canAddToHomeScreen } from '../platform';
import Icon from './Icon.vue';

const storageKey = 'bilby.homeScreenHint';

const dismissed = () => {
    try {
        return localStorage.getItem(storageKey) === 'dismissed';
    } catch {
        return false;
    }
};

const visible = ref(canAddToHomeScreen() && !dismissed());

function dismiss() {
    visible.value = false;
    try {
        localStorage.setItem(storageKey, 'dismissed');
    } catch {
        // Private browsing: it shows again next time.
    }
}
</script>

<template>
    <div v-if="visible" class="flex items-start gap-x-3 border-t border-chip-950/10 pt-4">
        <Icon name="arrow-up-tray" class="mt-0.5 size-5 shrink-0 text-chip-600" />
        <p class="flex-1 text-sm/6 text-pretty text-neutral-600">
            <span class="font-medium text-chip-950">Full screen without the browser bars:</span>
            tap Share, then Add to Home Screen, and open Bilby from there.
        </p>
        <button type="button" class="btn btn-plain btn-icon -mt-1.5 -mr-2 size-9 text-neutral-500" aria-label="Dismiss" title="Dismiss" @click="dismiss">
            <Icon name="x-mark" />
        </button>
    </div>
</template>
