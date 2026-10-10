// "Reset the clock?" and friends: one confirmation dialog for the whole app, shown by ConfirmDialog.vue.

import { shallowRef } from 'vue';

export interface Confirmation {
    title: string;
    message: string;
    action: string;
    destructive?: boolean;
    resolve: (confirmed: boolean) => void;
}

export const pending = shallowRef<Confirmation | null>(null);

export function confirm(options: Omit<Confirmation, 'resolve'>): Promise<boolean> {
    pending.value?.resolve(false);
    return new Promise((resolve) => {
        pending.value = { ...options, resolve };
    });
}

export function answer(confirmed: boolean): void {
    pending.value?.resolve(confirmed);
    pending.value = null;
}
