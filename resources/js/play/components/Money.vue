<script setup lang="ts">
// An amount with its currency first and smaller, "CHF 1’250", whatever order the locale uses.
import { computed } from 'vue';
import { moneyParts } from '../kit/format';

const props = defineProps<{ amount: number; currency: string }>();
const parts = computed(() => moneyParts(props.amount, props.currency));
</script>

<template>
    <span class="whitespace-nowrap"><span v-if="parts.currency" class="mr-[0.25em] text-[0.6em]">{{ parts.currency }}</span>{{ parts.number }}</span>
</template>
